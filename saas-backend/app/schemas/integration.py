from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class IntegrationBase(BaseModel):
    provider: str
    credentials: Dict[str, Any]
    is_active: bool = True

class IntegrationCreate(IntegrationBase):
    pass

class IntegrationUpdate(BaseModel):
    credentials: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class IntegrationResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    provider: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Omitting credentials for security
    model_config = ConfigDict(from_attributes=True)
