import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

class Integration(Base, TimestampMixin, TenantMixin):
    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(50), nullable=False) # e.g., 'slack', 'github', 'datadog'
    credentials = Column(JSONB, nullable=False) # e.g., {"api_token": "...", "webhook_url": "..."}
    is_active = Column(Boolean, default=True, nullable=False)
