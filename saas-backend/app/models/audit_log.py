import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base
from app.db.mixins import TimestampMixin

class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="SET NULL"), nullable=True)
    
    action = Column(String(255), nullable=False) # e.g. "subscription.upgraded"
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(255), nullable=True)
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    before_state = Column(JSONB, nullable=True)
    after_state = Column(JSONB, nullable=True)

    __table_args__ = (
        Index('idx_audit_logs_tenant_created', 'tenant_id', 'created_at', postgresql_using='btree'),
    )
