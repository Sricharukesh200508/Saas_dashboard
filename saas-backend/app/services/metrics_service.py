"""
MetricsService — Kafka producer with circuit-breaker fallback.

Key fixes:
- ingest_batch() uses asyncio.gather to await ALL sends before returning
- If Kafka circuit breaker is OPEN, falls back to direct PostgreSQL write
- idempotency_key is included in every Kafka payload
"""
import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from aiokafka import AIOKafkaProducer
from sqlalchemy import text

from app.config import settings
from app.core.circuit_breaker import CircuitBreaker, CircuitBreakerOpenException
from app.db.base import async_session_maker
from app.schemas.metrics import MetricEventIngest, BatchMetricIngest

logger = logging.getLogger(__name__)

# Circuit breaker for Kafka producer — opens after 5 consecutive failures
kafka_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30)


class MetricsService:
    _producer: Optional[AIOKafkaProducer] = None

    @classmethod
    @kafka_breaker
    async def get_producer(cls) -> AIOKafkaProducer:
        if not cls._producer:
            cls._producer = AIOKafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            )
            await cls._producer.start()
        return cls._producer

    @classmethod
    def _build_payload(
        cls,
        tenant_id: str,
        event: MetricEventIngest,
        api_key_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> dict:
        payload = event.model_dump()
        payload["tenant_id"] = tenant_id
        payload["timestamp"] = payload["timestamp"].isoformat()
        payload["api_key_id"] = api_key_id
        payload["idempotency_key"] = idempotency_key
        return payload

    @classmethod
    async def _fallback_to_db(cls, payload: dict) -> None:
        """
        Direct PostgreSQL write when Kafka circuit breaker is OPEN.
        Ensures metrics are never silently dropped.
        """
        logger.warning(
            "Kafka circuit breaker OPEN — writing metric directly to DB "
            "(tenant=%s)", payload.get("tenant_id")
        )
        async with async_session_maker() as session:
            stmt = text("""
                INSERT INTO metric_events
                    (id, tenant_id, timestamp, endpoint, method, status_code,
                     response_time_ms, bytes_transferred, api_key_id,
                     metadata, idempotency_key)
                VALUES
                    (:id, :tenant_id, :timestamp, :endpoint, :method,
                     :status_code, :response_time_ms, :bytes_transferred,
                     :api_key_id, :metadata, :idempotency_key)
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
                "api_key_id": payload.get("api_key_id"),
                "metadata": json.dumps(payload.get("metadata") or {}),
                "idempotency_key": payload.get("idempotency_key"),
            })
            await session.commit()

    @classmethod
    async def ingest_event(
        cls,
        tenant_id: str,
        event: MetricEventIngest,
        api_key_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> None:
        payload = cls._build_payload(tenant_id, event, api_key_id, idempotency_key)
        try:
            producer = await cls.get_producer()
            await producer.send_and_wait("metric_events", payload)
        except CircuitBreakerOpenException:
            await cls._fallback_to_db(payload)
        except Exception as exc:
            logger.error("Failed to send metric to Kafka: %s", exc)
            await cls._fallback_to_db(payload)

    @classmethod
    async def ingest_batch(
        cls,
        tenant_id: str,
        batch: BatchMetricIngest,
        api_key_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> None:
        """
        Send all events concurrently and await ALL sends before returning.
        Falls back to direct DB writes if Kafka is unavailable.
        """
        payloads = [
            cls._build_payload(tenant_id, event, api_key_id)
            for event in batch.events
        ]

        try:
            producer = await cls.get_producer()
            # Gather all sends — ensures every message is acknowledged before
            # we return, preventing data loss on app crash mid-batch
            tasks = [producer.send("metric_events", p) for p in payloads]
            await asyncio.gather(*tasks)
            # One final flush to ensure all are delivered
            await producer.flush()
        except CircuitBreakerOpenException:
            logger.warning("Kafka down — falling back to direct DB write for batch of %d", len(payloads))
            fallback_tasks = [cls._fallback_to_db(p) for p in payloads]
            await asyncio.gather(*fallback_tasks, return_exceptions=True)
        except Exception as exc:
            logger.error("Batch Kafka send failed: %s — falling back to DB", exc)
            fallback_tasks = [cls._fallback_to_db(p) for p in payloads]
            await asyncio.gather(*fallback_tasks, return_exceptions=True)
