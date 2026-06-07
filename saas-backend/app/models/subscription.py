import uuid
from sqlalchemy import Column, String, Enum, DateTime, BigInteger, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

class Subscription(Base, TimestampMixin, TenantMixin):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan = Column(Enum('starter', 'pro', 'enterprise', name='sub_plan_enum'), default='starter', nullable=False)
    status = Column(Enum('active', 'past_due', 'cancelled', 'trialing', name='sub_status_enum'), default='trialing', nullable=False)
    stripe_subscription_id = Column(String(255), nullable=True, unique=True)
    stripe_customer_id = Column(String(255), nullable=True)
    
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    
    api_call_limit = Column(BigInteger, default=1000, nullable=False)
    storage_limit_gb = Column(BigInteger, default=10, nullable=False)

    __table_args__ = (
        UniqueConstraint('tenant_id', name='uq_tenant_subscription'),
    )
