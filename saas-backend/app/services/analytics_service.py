"""
AnalyticsService — multi-store analytics queries.

Routing:
- < 7 days → TimescaleDB (fast, hot data)
- >= 7 days → ClickHouse (OLAP, cold data)

Caching:
- Overview cached for 60 seconds (frequently polled by dashboards)
- OLAP results cached for 5 minutes
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.clickhouse import ClickHouseClient
from app.utils.cache import cache

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @cache(ttl=60, key_prefix="analytics.overview")
    async def get_overview(self, tenant_id: str) -> dict:
        """
        Returns summary metrics for the last 24 hours from TimescaleDB.
        Cached for 60 seconds.
        """
        query = text("""
            SELECT
                COUNT(*)                                        AS total_calls,
                COUNT(*) FILTER (WHERE status_code < 400)      AS success_calls,
                COUNT(*) FILTER (WHERE status_code >= 400)     AS error_calls,
                AVG(response_time_ms)                          AS avg_response_ms,
                PERCENTILE_CONT(0.95) WITHIN GROUP (
                    ORDER BY response_time_ms
                )                                              AS p95_response_ms,
                PERCENTILE_CONT(0.99) WITHIN GROUP (
                    ORDER BY response_time_ms
                )                                              AS p99_response_ms,
                SUM(bytes_transferred)                         AS total_bytes
            FROM metric_events
            WHERE tenant_id = :tenant_id
              AND timestamp >= NOW() - INTERVAL '24 hours'
        """)
        result = await self.db.execute(query, {"tenant_id": tenant_id})
        row = result.fetchone()

        if not row:
            return self._empty_overview()

        total = row.total_calls or 0
        errors = row.error_calls or 0
        return {
            "total_calls": total,
            "success_calls": row.success_calls or 0,
            "error_calls": errors,
            "error_rate": round((errors / total * 100), 2) if total else 0.0,
            "avg_response_ms": round(row.avg_response_ms or 0, 2),
            "p95_response_ms": round(row.p95_response_ms or 0, 2),
            "p99_response_ms": round(row.p99_response_ms or 0, 2),
            "total_bytes": row.total_bytes or 0,
        }

    @cache(ttl=300, key_prefix="analytics.timeseries")
    async def get_timeseries(
        self,
        tenant_id: str,
        granularity: str = "hour",
        days: int = 7,
    ) -> list:
        """
        Time-bucketed API call volume and latency metrics.
        Routes to ClickHouse for >7 days, TimescaleDB otherwise.
        """
        if days > 7:
            return self._clickhouse_timeseries(tenant_id, granularity, days)

        bucket_expr = {
            "minute": "time_bucket('1 minute', timestamp)",
            "hour":   "time_bucket('1 hour',   timestamp)",
            "day":    "time_bucket('1 day',     timestamp)",
        }.get(granularity, "time_bucket('1 hour', timestamp)")

        query = text(f"""
            SELECT
                {bucket_expr}                                  AS bucket,
                COUNT(*)                                       AS total_calls,
                COUNT(*) FILTER (WHERE status_code >= 400)    AS error_calls,
                AVG(response_time_ms)                         AS avg_response_ms
            FROM metric_events
            WHERE tenant_id = :tenant_id
              AND timestamp >= NOW() - INTERVAL '{days} days'
            GROUP BY bucket
            ORDER BY bucket
        """)
        result = await self.db.execute(query, {"tenant_id": tenant_id})
        return [dict(r._mapping) for r in result.fetchall()]

    @cache(ttl=300, key_prefix="analytics.top_endpoints")
    async def get_top_endpoints(
        self, tenant_id: str, limit: int = 10, days: int = 1
    ) -> list:
        """Top endpoints by call count, last N days."""
        query = text("""
            SELECT
                endpoint,
                COUNT(*)                                    AS total_calls,
                AVG(response_time_ms)                       AS avg_response_ms,
                COUNT(*) FILTER (WHERE status_code >= 400)  AS error_calls
            FROM metric_events
            WHERE tenant_id = :tenant_id
              AND timestamp >= NOW() - INTERVAL :interval
            GROUP BY endpoint
            ORDER BY total_calls DESC
            LIMIT :limit
        """)
        result = await self.db.execute(query, {
            "tenant_id": tenant_id,
            "interval": f"{days} days",
            "limit": limit,
        })
        return [dict(r._mapping) for r in result.fetchall()]

    def _clickhouse_timeseries(
        self, tenant_id: str, granularity: str, days: int
    ) -> list:
        """OLAP query via ClickHouse for long date ranges (>7 days)."""
        try:
            client = ClickHouseClient.get_client()
            trunc_fn = {
                "minute": "toStartOfMinute",
                "hour":   "toStartOfHour",
                "day":    "toStartOfDay",
            }.get(granularity, "toStartOfHour")

            sql = f"""
                SELECT
                    {trunc_fn}(timestamp) AS bucket,
                    count()               AS total_calls,
                    countIf(status_code >= 400) AS error_calls,
                    avg(response_time_ms) AS avg_response_ms
                FROM metric_events_ch
                WHERE tenant_id = '{tenant_id}'
                  AND timestamp >= now() - INTERVAL {days} DAY
                GROUP BY bucket
                ORDER BY bucket
            """
            result = client.query(sql)
            return [
                {
                    "bucket": row[0],
                    "total_calls": row[1],
                    "error_calls": row[2],
                    "avg_response_ms": round(row[3], 2),
                }
                for row in result.result_rows
            ]
        except Exception as exc:
            logger.error("ClickHouse timeseries query failed: %s", exc)
            return []

    @staticmethod
    def _empty_overview() -> dict:
        return {
            "total_calls": 0,
            "success_calls": 0,
            "error_calls": 0,
            "error_rate": 0.0,
            "avg_response_ms": 0.0,
            "p95_response_ms": 0.0,
            "p99_response_ms": 0.0,
            "total_bytes": 0,
        }
