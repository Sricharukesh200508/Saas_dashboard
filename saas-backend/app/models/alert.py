import uuid
from sqlalchemy import Column, String, Float, Integer, Boolean, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

class Alert(Base, TimestampMixin, TenantMixin):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    
    metric = Column(Enum('api_calls', 'error_rate', 'response_time', 'storage', name='alert_metric_enum'), nullable=False)
    operator = Column(Enum('gt', 'lt', 'gte', 'lte', 'eq', name='alert_operator_enum'), nullable=False)
    threshold = Column(Float, nullable=False)
    window_minutes = Column(Integer, default=5, nullable=False)
    
    channels = Column(JSONB, default=dict) # e.g. {"email": ["admin@x.com"], "slack": "webhook"}
    
    is_active = Column(Boolean, default=True, nullable=False)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
