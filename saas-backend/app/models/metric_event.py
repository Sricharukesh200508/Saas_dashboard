import uuid
from sqlalchemy import Column, String, Integer, Float, BigInteger, DateTime, PrimaryKeyConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

class MetricEvent(Base):
    """
    TimescaleDB hypertable for metric events.
    Partitioned by timestamp and tenant_id.
    """
    __tablename__ = "metric_events"

    # For TimescaleDB, id is just a UUID but the primary key is usually composite if partitioned by time
    # We will make (tenant_id, timestamp) the primary key or a unique index depending on Timescale constraints.
    # Often in TimescaleDB, we just let it handle the partitioning and omit PK or include time.
    id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    
    endpoint = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Float, nullable=False)
    bytes_transferred = Column(BigInteger, default=0)
    
    user_id = Column(UUID(as_uuid=True), nullable=True)
    api_key_id = Column(UUID(as_uuid=True), nullable=True)
    
    metadata_ = Column("metadata", JSONB, default=dict)

    __table_args__ = (
        PrimaryKeyConstraint('tenant_id', 'timestamp', 'id'),
        Index('idx_metric_events_tenant_time', 'tenant_id', 'timestamp', postgresql_using='btree'),
        Index('idx_metric_events_endpoint', 'tenant_id', 'endpoint', 'timestamp', postgresql_using='btree'),
    )

class MetricAggregate(Base):
    """
    Pre-aggregated summary table (or Continuous Aggregate view)
    """
    __tablename__ = "metric_aggregates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    bucket = Column(DateTime(timezone=True), nullable=False)
    granularity = Column(String(20), nullable=False) # 'minute', 'hour', 'day'
    
    endpoint = Column(String(255), nullable=False)
    total_calls = Column(BigInteger, default=0)
    success_calls = Column(BigInteger, default=0)
    error_calls = Column(BigInteger, default=0)
    
    avg_response_ms = Column(Float, default=0.0)
    p95_response_ms = Column(Float, default=0.0)
    p99_response_ms = Column(Float, default=0.0)
    total_bytes = Column(BigInteger, default=0)
