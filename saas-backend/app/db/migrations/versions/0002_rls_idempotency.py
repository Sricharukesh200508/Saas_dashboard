"""RLS enforcement and idempotency key column

Revision ID: 0002_rls_idempotency
Revises: 0001_initial
Create Date: 2026-06-08 00:00:00.000000

Adds:
- idempotency_key column to metric_events (deduplication)
- Row-Level Security on all tenant-scoped tables
- RLS policies enforced via app.current_tenant session variable
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_rls_idempotency'
down_revision: Union[str, None] = '0001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. Add idempotency_key to metric_events
    # ------------------------------------------------------------------ #
    op.add_column(
        'metric_events',
        sa.Column('idempotency_key', sa.String(255), nullable=True, unique=False)
    )
    # Partial unique index: only enforce uniqueness when key is provided
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_metric_events_idempotency_key "
        "ON metric_events (idempotency_key) WHERE idempotency_key IS NOT NULL;"
    )

    # ------------------------------------------------------------------ #
    # 2. Enable RLS on all tenant-scoped tables
    # ------------------------------------------------------------------ #
    tenant_scoped_tables = [
        'metric_events',
        'users',
        'api_keys',
        'subscriptions',
        'alerts',
        'audit_logs',
    ]
    for table in tenant_scoped_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        # Allow superuser / migration user to bypass RLS
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")

    # ------------------------------------------------------------------ #
    # 3. Create tenant isolation policies
    #    Uses current_setting('app.current_tenant', true) — the 'true'
    #    makes it return NULL instead of raising an error when unset,
    #    which allows superuser sessions (migrations, admin) to see all rows.
    # ------------------------------------------------------------------ #
    policies = {
        'metric_events': 'tenant_id',
        'users':         'tenant_id',
        'api_keys':      'tenant_id',
        'subscriptions': 'tenant_id',
        'alerts':        'tenant_id',
        'audit_logs':    'tenant_id',
    }

    for table, col in policies.items():
        op.execute(f"""
            CREATE POLICY tenant_isolation ON {table}
            AS PERMISSIVE
            FOR ALL
            USING (
                current_setting('app.current_tenant', true) IS NULL
                OR current_setting('app.current_tenant', true) = ''
                OR {col}::text = current_setting('app.current_tenant', true)
            )
            WITH CHECK (
                current_setting('app.current_tenant', true) IS NULL
                OR current_setting('app.current_tenant', true) = ''
                OR {col}::text = current_setting('app.current_tenant', true)
            );
        """)

    # ------------------------------------------------------------------ #
    # 4. Create a helper function so the app can SET the tenant context
    #    without needing SUPERUSER privileges.
    # ------------------------------------------------------------------ #
    op.execute("""
        CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid text)
        RETURNS void AS $$
        BEGIN
            PERFORM set_config('app.current_tenant', tenant_uuid, true);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """)


def downgrade() -> None:
    # Remove helper function
    op.execute("DROP FUNCTION IF EXISTS set_tenant_context(text);")

    # Drop policies
    tenant_scoped_tables = [
        'metric_events', 'users', 'api_keys',
        'subscriptions', 'alerts', 'audit_logs',
    ]
    for table in tenant_scoped_tables:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")

    # Remove idempotency_key
    op.execute("DROP INDEX IF EXISTS uq_metric_events_idempotency_key;")
    op.drop_column('metric_events', 'idempotency_key')
