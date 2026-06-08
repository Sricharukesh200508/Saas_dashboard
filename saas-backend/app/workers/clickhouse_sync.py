"""
ClickHouse sync worker — Celery periodic task that syncs recent metric_events
from PostgreSQL/TimescaleDB to ClickHouse for OLAP analytics.

Strategy:
- Runs every 5 minutes (configured in celery_app.py beat schedule)
- Queries metric_events inserted in the last 10 minutes (overlapping window for safety)
- Bulk-inserts into ClickHouse metric_events_ch table
- Idempotent: ClickHouse table uses ReplacingMergeTree, so duplicate inserts are safe

ClickHouse table DDL (run once):
    CREATE TABLE IF NOT EXISTS metric_events_ch (
        id          UUID,
        tenant_id   UUID,
        timestamp   DateTime,
        endpoint    String,
        method      String,
        status_code UInt16,
        response_time_ms Float32,
        bytes_transferred UInt64,
        api_key_id  Nullable(UUID),
        metadata    String,
        ingested_at DateTime DEFAULT now()
    ) ENGINE = ReplacingMergeTree(ingested_at)
    PARTITION BY toYYYYMM(timestamp)
    ORDER BY (tenant_id, timestamp, id);
"""
import logging
from datetime import datetime, timezone, timedelta

from app.workers.celery_app import celery_app
from app.db.clickhouse import ClickHouseClient

logger = logging.getLogger(__name__)

SYNC_LOOKBACK_MINUTES = 10  # overlap window to handle late-arriving rows


@celery_app.task(name="workers.clickhouse_sync.sync_metrics_to_clickhouse")
def sync_metrics_to_clickhouse():
    """
    Celery task: pull recent rows from PostgreSQL and upsert into ClickHouse.
    Designed to be idempotent — safe to run multiple times.
    """
    import asyncio
    asyncio.run(_async_sync())


async def _async_sync():
    from app.db.base import async_replica_session_maker
    from sqlalchemy import text

    since = datetime.now(timezone.utc) - timedelta(minutes=SYNC_LOOKBACK_MINUTES)

    async with async_replica_session_maker() as session:
        result = await session.execute(
            text("""
                SELECT id, tenant_id, timestamp, endpoint, method, status_code,
                       response_time_ms, bytes_transferred, api_key_id,
                       metadata::text
                FROM metric_events
                WHERE timestamp >= :since
                ORDER BY timestamp
            """),
            {"since": since}
        )
        rows = result.fetchall()

    if not rows:
        logger.debug("ClickHouse sync: no new rows since %s", since)
        return

    logger.info("ClickHouse sync: syncing %d rows", len(rows))

    try:
        client = ClickHouseClient.get_client()
        data = [
            [
                str(r.id),
                str(r.tenant_id),
                r.timestamp,
                r.endpoint,
                r.method,
                r.status_code,
                float(r.response_time_ms),
                int(r.bytes_transferred or 0),
                str(r.api_key_id) if r.api_key_id else None,
                r.metadata or "{}",
            ]
            for r in rows
        ]
        client.insert(
            "metric_events_ch",
            data,
            column_names=[
                "id", "tenant_id", "timestamp", "endpoint", "method",
                "status_code", "response_time_ms", "bytes_transferred",
                "api_key_id", "metadata",
            ],
        )
        logger.info("ClickHouse sync: %d rows inserted", len(data))
    except Exception as exc:
        logger.error("ClickHouse sync failed: %s", exc)
        raise
