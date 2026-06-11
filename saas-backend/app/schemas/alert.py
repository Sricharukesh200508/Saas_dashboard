from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime

class AlertBase(BaseModel):
    name: str
    description: Optional[str] = None
    metric: str
    operator: str
    threshold: float
    window_minutes: int = 5
    channels: Dict[str, List[str]] = {}
    is_active: bool = True

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    metric: Optional[str] = None
    operator: Optional[str] = None
    threshold: Optional[float] = None
    window_minutes: Optional[int] = None
    channels: Optional[Dict[str, List[str]]] = None
    is_active: Optional[bool] = None

class AlertResponse(AlertBase):
    id: UUID
    tenant_id: UUID
    last_triggered_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
