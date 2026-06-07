from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Boolean, String, ForeignKey
from sqlalchemy.orm import declarative_mixin, declared_attr
from sqlalchemy.dialects.postgresql import UUID
import uuid

@declarative_mixin
class TimestampMixin:
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

@declarative_mixin
class TenantMixin:
    @declared_attr
    def tenant_id(cls):
        # We assume the 'tenants' table will be created.
        return Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete="CASCADE"), nullable=False, index=True)

@declarative_mixin
class SoftDeleteMixin:
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)
