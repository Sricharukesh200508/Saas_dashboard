import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

class ApiKey(Base, TimestampMixin, TenantMixin):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)
    
    key_hash = Column(String(255), nullable=False, unique=True)
    key_prefix = Column(String(8), nullable=False)
    name = Column(String(255), nullable=False)
    
    scopes = Column(JSONB, nullable=False, default=list)
    
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
