"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable TimescaleDB Extension (requires superuser, handled by timescaledb docker image normally, but good to ensure)
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")
    
    # 2. Create Enums
    sa.Enum('starter', 'pro', 'enterprise', name='tenant_plan_enum').create(op.get_bind())
    sa.Enum('owner', 'admin', 'member', 'viewer', name='user_role_enum').create(op.get_bind())
    sa.Enum('starter', 'pro', 'enterprise', name='sub_plan_enum').create(op.get_bind())
    sa.Enum('active', 'past_due', 'cancelled', 'trialing', name='sub_status_enum').create(op.get_bind())
    sa.Enum('api_calls', 'error_rate', 'response_time', 'storage', name='alert_metric_enum').create(op.get_bind())
    sa.Enum('gt', 'lt', 'gte', 'lte', 'eq', name='alert_operator_enum').create(op.get_bind())

    # 3. Create Tables
    op.create_table('tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('domain', sa.String(length=255), nullable=True),
        sa.Column('plan', postgresql.ENUM('starter', 'pro', 'enterprise', name='tenant_plan_enum', create_type=False), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tenants_slug'), 'tenants', ['slug'], unique=True)

    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', postgresql.ENUM('owner', 'admin', 'member', 'viewer', name='user_role_enum', create_type=False), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', 'email', name='uq_tenant_email')
    )
    op.create_index(op.f('ix_users_tenant_id'), 'users', ['tenant_id'], unique=False)

    op.create_table('subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('plan', postgresql.ENUM('starter', 'pro', 'enterprise', name='sub_plan_enum', create_type=False), nullable=False),
        sa.Column('status', postgresql.ENUM('active', 'past_due', 'cancelled', 'trialing', name='sub_status_enum', create_type=False), nullable=False),
        sa.Column('stripe_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('api_call_limit', sa.BigInteger(), nullable=False),
        sa.Column('storage_limit_gb', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', name='uq_tenant_subscription')
    )
    op.create_index(op.f('ix_subscriptions_tenant_id'), 'subscriptions', ['tenant_id'], unique=False)

    op.create_table('api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key_hash', sa.String(length=255), nullable=False),
        sa.Column('key_prefix', sa.String(length=8), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('scopes', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key_hash')
    )
    op.create_index(op.f('ix_api_keys_tenant_id'), 'api_keys', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_api_keys_user_id'), 'api_keys', ['user_id'], unique=False)

    op.create_table('alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('metric', postgresql.ENUM('api_calls', 'error_rate', 'response_time', 'storage', name='alert_metric_enum', create_type=False), nullable=False),
        sa.Column('operator', postgresql.ENUM('gt', 'lt', 'gte', 'lte', 'eq', name='alert_operator_enum', create_type=False), nullable=False),
        sa.Column('threshold', sa.Float(), nullable=False),
        sa.Column('window_minutes', sa.Integer(), nullable=False),
        sa.Column('channels', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('last_triggered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_alerts_tenant_id'), 'alerts', ['tenant_id'], unique=False)

    op.create_table('audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(length=255), nullable=False),
        sa.Column('resource_type', sa.String(length=100), nullable=True),
        sa.Column('resource_id', sa.String(length=255), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('before_state', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('after_state', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_audit_logs_tenant_created', 'audit_logs', ['tenant_id', 'created_at'], unique=False)

    op.create_table('metric_aggregates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bucket', sa.DateTime(timezone=True), nullable=False),
        sa.Column('granularity', sa.String(length=20), nullable=False),
        sa.Column('endpoint', sa.String(length=255), nullable=False),
        sa.Column('total_calls', sa.BigInteger(), nullable=True),
        sa.Column('success_calls', sa.BigInteger(), nullable=True),
        sa.Column('error_calls', sa.BigInteger(), nullable=True),
        sa.Column('avg_response_ms', sa.Float(), nullable=True),
        sa.Column('p95_response_ms', sa.Float(), nullable=True),
        sa.Column('p99_response_ms', sa.Float(), nullable=True),
        sa.Column('total_bytes', sa.BigInteger(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_metric_aggregates_tenant_id'), 'metric_aggregates', ['tenant_id'], unique=False)

    op.create_table('metric_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('endpoint', sa.String(length=255), nullable=False),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('response_time_ms', sa.Float(), nullable=False),
        sa.Column('bytes_transferred', sa.BigInteger(), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('api_key_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('tenant_id', 'timestamp', 'id')
    )
    op.create_index('idx_metric_events_endpoint', 'metric_events', ['tenant_id', 'endpoint', 'timestamp'], unique=False)
    op.create_index('idx_metric_events_tenant_time', 'metric_events', ['tenant_id', 'timestamp'], unique=False)

    # 4. TimescaleDB Setup
    op.execute("SELECT create_hypertable('metric_events', 'timestamp', partitioning_column => 'tenant_id', number_partitions => 4, if_not_exists => TRUE);")
    
    op.execute("ALTER TABLE metric_events SET (timescaledb.compress, timescaledb.compress_segmentby = 'tenant_id,endpoint');")
    
    op.execute("SELECT add_compression_policy('metric_events', INTERVAL '30 days', if_not_exists => TRUE);")


def downgrade() -> None:
    op.drop_table('metric_events')
    op.drop_table('metric_aggregates')
    op.drop_table('audit_logs')
    op.drop_table('alerts')
    op.drop_table('api_keys')
    op.drop_table('subscriptions')
    op.drop_table('users')
    op.drop_table('tenants')
    
    sa.Enum(name='alert_operator_enum').drop(op.get_bind())
    sa.Enum(name='alert_metric_enum').drop(op.get_bind())
    sa.Enum(name='sub_status_enum').drop(op.get_bind())
    sa.Enum(name='sub_plan_enum').drop(op.get_bind())
    sa.Enum(name='user_role_enum').drop(op.get_bind())
    sa.Enum(name='tenant_plan_enum').drop(op.get_bind())
