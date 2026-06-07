import uuid
from sqlalchemy import Column, String, Boolean, Enum, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

class User(Base, TimestampMixin, TenantMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum('owner', 'admin', 'member', 'viewer', name='user_role_enum'), default='viewer', nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint('tenant_id', 'email', name='uq_tenant_email'),
    )
