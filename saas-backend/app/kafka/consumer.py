"""
Kafka Consumer — reads from metric_events topic and persists to PostgreSQL.

Features:
- Async AIOKafka consumer with auto-commit disabled (manual commit after DB persist)
- Idempotency: skips messages whose idempotency_key already exists in DB
- After successful DB write, publishes to Redis pub/sub for WebSocket broadcast
- Graceful shutdown via asyncio.Event
- Dead-letter logging for messages that fail after retries
"""
import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from aiokafka import AIOKafkaConsumer
from aiokafka.errors import KafkaConnectionError
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.db.base import async_session_maker

logger = logging.getLogger(__name__)

TOPIC = "metric_events"
GROUP_ID = "saas-metrics-persister"
MAX_RETRIES = 3


async def _persist_event(payload: dict, session) -> bool:
    """
    Insert a single metric event into PostgreSQL.
    Returns True on success, False if duplicate (idempotency).
    """
    idempotency_key: Optional[str] = payload.get("idempotency_key")

    try:
        stmt = text("""
            INSERT INTO metric_events
                (id, tenant_id, timestamp, endpoint, method, status_code,
                 response_time_ms, bytes_transferred, user_id, api_key_id,
                 metadata, idempotency_key)
            VALUES
                (:id, :tenant_id, :timestamp, :endpoint, :method, :status_code,
                 :response_time_ms, :bytes_transferred, :user_id, :api_key_id,
                 :metadata, :idempotency_key)
            ON CONFLICT DO NOTHING
        """)

        await session.execute(stmt, {
            "id": str(uuid.uuid4()),
            "tenant_id": payload["tenant_id"],
            "timestamp": datetime.fromisoformat(payload["timestamp"]),
            "endpoint": payload["endpoint"],
            "method": payload["method"],
            "status_code": payload["status_code"],
            "response_time_ms": payload["response_time_ms"],
            "bytes_transferred": payload.get("bytes_transferred", 0),
            "user_id": payload.get("user_id"),
            "api_key_id": payload.get("api_key_id"),
            "metadata": json.dumps(payload.get("metadata") or {}),
            "idempotency_key": idempotency_key,
        })
        await session.commit()
        return True

    except IntegrityError:
        await session.rollback()
        logger.info("Duplicate metric skipped (idempotency_key=%s)", idempotency_key)
        return False
    except Exception as exc:
        await session.rollback()
        logger.error("Failed to persist metric event: %s | payload: %s", exc, payload)
        raise


async def _publish_to_redis(payload: dict):
    """Publish persisted metric to Redis pub/sub for WebSocket broadcast."""
    try:
        import redis.asyncio as redis_async  # lazy import to avoid circular deps
        client = redis_async.from_url(settings.REDIS_URL, decode_responses=True)
        tenant_id = payload.get("tenant_id", "unknown")
        channel = f"metrics:{tenant_id}"
        await client.publish(channel, json.dumps(payload))
        await client.aclose()
    except Exception as exc:
        # Redis publish failure is non-fatal — metrics are already persisted
        logger.warning("Redis publish failed (non-fatal): %s", exc)


async def consume_loop(stop_event: asyncio.Event):
    """
    Main consumer loop. Runs until stop_event is set.
    Retries connection on KafkaConnectionError with exponential backoff.
    """
    retry_delay = 5
    consumer: Optional[AIOKafkaConsumer] = None

    while not stop_event.is_set():
        try:
            consumer = AIOKafkaConsumer(
                TOPIC,
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                group_id=GROUP_ID,
                enable_auto_commit=False,
                auto_offset_reset="earliest",
                value_deserializer=lambda v: json.loads(v.decode("utf-8")),
                max_poll_records=100,
            )
            await consumer.start()
            logger.info("Kafka consumer started. Listening on topic '%s'", TOPIC)
            retry_delay = 5  # reset backoff on successful connect

            async for msg in consumer:
                if stop_event.is_set():
                    break

                payload = msg.value
                attempt = 0
                success = False

                while attempt < MAX_RETRIES and not success:
                    try:
                        async with async_session_maker() as session:
                            success = await _persist_event(payload, session)
                    except Exception as exc:
                        attempt += 1
                        logger.warning(
                            "Retry %d/%d for offset %d: %s",
                            attempt, MAX_RETRIES, msg.offset, exc
                        )
                        await asyncio.sleep(2 ** attempt)

                if success:
                    # Broadcast to Redis for live WebSocket streaming
                    await _publish_to_redis(payload)
                elif attempt == MAX_RETRIES:
                    # Dead-letter: log the full payload for manual recovery
                    logger.error(
                        "DEAD_LETTER | topic=%s partition=%d offset=%d payload=%s",
                        msg.topic, msg.partition, msg.offset, json.dumps(payload)
                    )

                # Manually commit offset after processing
                await consumer.commit()

        except KafkaConnectionError as exc:
            logger.error(
                "Kafka connection error: %s. Retrying in %ds...", exc, retry_delay
            )
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 60)  # exponential backoff, cap at 60s

        except asyncio.CancelledError:
            break

        except Exception as exc:
            logger.exception("Unexpected consumer error: %s", exc)
            await asyncio.sleep(retry_delay)

        finally:
            if consumer:
                try:
                    await consumer.stop()
                except Exception:
                    pass
                consumer = None

    logger.info("Kafka consumer loop exited.")


# ──────────────────────────────────────────────────────────────────────────────
# FastAPI lifespan integration helpers
# ──────────────────────────────────────────────────────────────────────────────

_stop_event: Optional[asyncio.Event] = None
_consumer_task: Optional[asyncio.Task] = None


async def start_consumer():
    """Start the consumer as a background asyncio Task."""
    global _stop_event, _consumer_task
    _stop_event = asyncio.Event()
    _consumer_task = asyncio.create_task(
        consume_loop(_stop_event), name="kafka-consumer"
    )
    logger.info("Kafka consumer background task started.")


async def stop_consumer():
    """Signal the consumer to stop and await clean shutdown."""
    global _stop_event, _consumer_task
    if _stop_event:
        _stop_event.set()
    if _consumer_task:
        try:
            await asyncio.wait_for(_consumer_task, timeout=10)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            _consumer_task.cancel()
    logger.info("Kafka consumer stopped.")
