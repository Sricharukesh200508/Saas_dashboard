import uuid
from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base
from app.db.mixins import TimestampMixin

class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    domain = Column(String(255), nullable=True)
    plan = Column(Enum('starter', 'pro', 'enterprise', name='tenant_plan_enum'), default='starter', nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    settings = Column(JSONB, default={})
