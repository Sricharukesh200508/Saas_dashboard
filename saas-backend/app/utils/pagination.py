"""
Cursor-based pagination utility.

Uses keyset/cursor pagination (timestamp + UUID) for stable performance
on large TimescaleDB datasets (avoids OFFSET which degrades at scale).

Usage:
    page = await paginate_metric_events(
        session=db,
        tenant_id=tenant_id,
        cursor=request.query_params.get("cursor"),
        limit=50,
    )
    return page
"""
import base64
import json
import logging
from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CursorPage(BaseModel, Generic[T]):
    """Paginated response with cursor for next page."""
    items: List[Any]
    next_cursor: Optional[str] = None
    has_more: bool
    total_hint: Optional[int] = None  # approximate count, not exact


def encode_cursor(timestamp: datetime, row_id: str) -> str:
    """Encode a stable cursor from timestamp + UUID."""
    data = json.dumps({"ts": timestamp.isoformat(), "id": str(row_id)})
    return base64.urlsafe_b64encode(data.encode()).decode()


def decode_cursor(cursor: str) -> Dict[str, Any]:
    """Decode a cursor string. Raises ValueError on invalid input."""
    try:
        data = base64.urlsafe_b64decode(cursor.encode()).decode()
        return json.loads(data)
    except Exception as exc:
        raise ValueError(f"Invalid cursor: {exc}")


async def paginate_metric_events(
    session: AsyncSession,
    tenant_id: str,
    cursor: Optional[str] = None,
    limit: int = 50,
    endpoint_filter: Optional[str] = None,
) -> CursorPage:
    """
    Cursor-based pagination for metric_events.
    Results are ordered by (timestamp DESC, id DESC) — newest first.
    """
    limit = min(limit, 1000)  # hard cap
    params: Dict[str, Any] = {"tenant_id": tenant_id, "limit": limit + 1}

    if cursor:
        decoded = decode_cursor(cursor)
        cursor_ts = decoded["ts"]
        cursor_id = decoded["id"]
        cursor_clause = """
            AND (timestamp < :cursor_ts
                 OR (timestamp = :cursor_ts AND id::text < :cursor_id))
        """
        params["cursor_ts"] = cursor_ts
        params["cursor_id"] = cursor_id
    else:
        cursor_clause = ""

    endpoint_clause = ""
    if endpoint_filter:
        endpoint_clause = "AND endpoint = :endpoint"
        params["endpoint"] = endpoint_filter

    query = text(f"""
        SELECT id, tenant_id, timestamp, endpoint, method, status_code,
               response_time_ms, bytes_transferred, api_key_id, metadata
        FROM metric_events
        WHERE tenant_id = :tenant_id
        {cursor_clause}
        {endpoint_clause}
        ORDER BY timestamp DESC, id DESC
        LIMIT :limit
    """)

    result = await session.execute(query, params)
    rows = result.mappings().all()

    has_more = len(rows) > limit
    items = [dict(r) for r in rows[:limit]]

    next_cursor = None
    if has_more and items:
        last = items[-1]
        next_cursor = encode_cursor(last["timestamp"], str(last["id"]))

    return CursorPage(items=items, next_cursor=next_cursor, has_more=has_more)
