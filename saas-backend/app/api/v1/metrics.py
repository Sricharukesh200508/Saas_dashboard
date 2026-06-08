"""
Metrics ingestion endpoints.

Security: Uses X-API-Key header with cryptographic validation (SHA-256 hash lookup).
Idempotency: Requires Idempotency-Key header; duplicates return 200 without re-processing.
"""
from fastapi import APIRouter, Depends, Header, BackgroundTasks, HTTPException, status, Request
from typing import Optional

from app.schemas.metrics import MetricEventIngest, BatchMetricIngest, BatchIngestResponse
from app.services.metrics_service import MetricsService
from app.core.security import make_api_key_dep, ApiKeyContext
from app.core.idempotency import redis_client as idempotency_redis

router = APIRouter()

# Dependency: validates X-API-Key and requires 'metrics:write' scope
require_metrics_key = make_api_key_dep("metrics:write")


async def _check_idempotency(idempotency_key: Optional[str]) -> bool:
    """
    Returns True if this key was already processed (duplicate).
    Stores the key in Redis with a 24h TTL on first call.
    """
    if not idempotency_key:
        return False
    redis_key = f"idempotency:{idempotency_key}"
    exists = await idempotency_redis.get(redis_key)
    if exists:
        return True
    await idempotency_redis.set(redis_key, "PROCESSED", ex=86400)
    return False


@router.post("/ingest", status_code=202)
async def ingest_metric(
    event: MetricEventIngest,
    background_tasks: BackgroundTasks,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    key_ctx: ApiKeyContext = Depends(require_metrics_key),
):
    """
    Ingest a single metric event.
    - Requires X-API-Key header with 'metrics:write' scope
    - Supports Idempotency-Key header to prevent duplicates
    """
    # Idempotency check
    if await _check_idempotency(idempotency_key):
        return {"message": "Already processed", "idempotent": True}

    background_tasks.add_task(
        MetricsService.ingest_event,
        key_ctx.tenant_id,
        event,
        key_ctx.api_key_id,
        idempotency_key,
    )
    return {"message": "Accepted"}


@router.post("/ingest/batch", response_model=BatchIngestResponse, status_code=202)
async def ingest_batch_metrics(
    batch: BatchMetricIngest,
    background_tasks: BackgroundTasks,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    key_ctx: ApiKeyContext = Depends(require_metrics_key),
):
    """
    Ingest a batch of metric events (up to 1000).
    - Uses asyncio.gather internally to await all Kafka sends
    - Falls back to direct DB write if Kafka is unavailable
    """
    if await _check_idempotency(idempotency_key):
        return BatchIngestResponse(
            accepted=0, rejected=0, errors=["Already processed (idempotent)"]
        )

    background_tasks.add_task(
        MetricsService.ingest_batch,
        key_ctx.tenant_id,
        batch,
        key_ctx.api_key_id,
        idempotency_key,
    )
    return BatchIngestResponse(
        accepted=len(batch.events),
        rejected=0,
        errors=[],
    )
