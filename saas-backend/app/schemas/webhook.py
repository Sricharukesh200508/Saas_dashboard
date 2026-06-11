from pydantic import BaseModel, ConfigDict, AnyHttpUrl
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class WebhookEndpointBase(BaseModel):
    name: str
    url: AnyHttpUrl
    events: List[str]
    is_active: bool = True

class WebhookEndpointCreate(WebhookEndpointBase):
    pass

class WebhookEndpointUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[AnyHttpUrl] = None
    events: Optional[List[str]] = None
    is_active: Optional[bool] = None

class WebhookEndpointResponse(WebhookEndpointBase):
    id: UUID
    tenant_id: UUID
    secret: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WebhookDeliveryResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    webhook_endpoint_id: UUID
    event_type: str
    url: str
    request_payload: Dict[str, Any]
    response_status: Optional[int]
    response_body: Optional[str]
    success: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
