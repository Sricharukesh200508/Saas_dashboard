from fastapi import APIRouter, Depends, Header, BackgroundTasks
from app.schemas.metrics import MetricEventIngest, BatchMetricIngest, BatchIngestResponse
from app.services.metrics_service import MetricsService

router = APIRouter()

@router.post("/ingest", status_code=202)
async def ingest_metric(
    event: MetricEventIngest, 
    background_tasks: BackgroundTasks,
    x_tenant_id: str = Header(...)
):
    # Send to Kafka asynchronously in background to ensure fast response (non-blocking)
    background_tasks.add_task(MetricsService.ingest_event, x_tenant_id, event)
    return {"message": "Accepted"}

@router.post("/ingest/batch", response_model=BatchIngestResponse, status_code=202)
async def ingest_batch_metrics(
    batch: BatchMetricIngest,
    background_tasks: BackgroundTasks,
    x_tenant_id: str = Header(...)
):
    background_tasks.add_task(MetricsService.ingest_batch, x_tenant_id, batch)
    return BatchIngestResponse(
        accepted=len(batch.events),
        rejected=0,
        errors=[]
    )
