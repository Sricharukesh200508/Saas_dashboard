import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

class WebhookEndpoint(Base, TimestampMixin, TenantMixin):
    __tablename__ = "webhook_endpoints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    url = Column(String(1024), nullable=False)
    secret = Column(String(255), nullable=True)
    events = Column(JSONB, default=list, nullable=False) # e.g. ["subscription.created", "invoice.paid"]
    is_active = Column(Boolean, default=True, nullable=False)

class WebhookDelivery(Base, TimestampMixin, TenantMixin):
    __tablename__ = "webhook_deliveries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    webhook_endpoint_id = Column(UUID(as_uuid=True), ForeignKey('webhook_endpoints.id', ondelete='CASCADE'), nullable=False)
    event_type = Column(String(255), nullable=False)
    url = Column(String(1024), nullable=False)
    request_payload = Column(JSONB, nullable=False)
    response_status = Column(Integer, nullable=True)
    response_body = Column(String, nullable=True)
    success = Column(Boolean, default=False, nullable=False)
