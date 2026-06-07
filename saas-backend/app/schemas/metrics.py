from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class MetricEventIngest(BaseModel):
    endpoint: str = Field(..., max_length=255)
    method: str = Field(..., max_length=10)
    status_code: int
    response_time_ms: float
    bytes_transferred: int = 0
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class BatchMetricIngest(BaseModel):
    events: List[MetricEventIngest] = Field(..., max_length=1000)

class BatchIngestResponse(BaseModel):
    accepted: int
    rejected: int
    errors: List[str]
