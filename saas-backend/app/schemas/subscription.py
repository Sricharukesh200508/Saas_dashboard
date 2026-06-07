from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class SubscriptionBase(BaseModel):
    plan: str
    status: str
    api_call_limit: int
    storage_limit_gb: int

class SubscriptionCreate(SubscriptionBase):
    tenant_id: UUID

class SubscriptionUpdate(BaseModel):
    plan: Optional[str] = None
    status: Optional[str] = None
    api_call_limit: Optional[int] = None
    storage_limit_gb: Optional[int] = None

class SubscriptionResponse(SubscriptionBase):
    id: UUID
    tenant_id: UUID
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
