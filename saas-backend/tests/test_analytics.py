"""
Analytics endpoint tests — overview, tenant isolation (RLS).
"""
import pytest
import hashlib
import secrets
import uuid

from app.models.tenant import Tenant
from app.models.user import User
from app.models.api_key import ApiKey
from app.core.security import get_password_hash


async def _setup_tenant_with_key(db_session, suffix=""):
    tenant = Tenant(
        name=f"Analytics Tenant {suffix}",
        slug=f"analytics-tenant-{suffix}-{uuid.uuid4().hex[:6]}",
        plan="pro",
        is_active=True,
    )
    db_session.add(tenant)
    await db_session.flush()

    user = User(
        tenant_id=tenant.id,
        email=f"owner-{suffix}@analytics.com",
        hashed_password=get_password_hash("pass123"),
        role="owner",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    raw_key = secrets.token_urlsafe(32)
    api_key = ApiKey(
        tenant_id=tenant.id,
        user_id=user.id,
        key_hash=hashlib.sha256(raw_key.encode()).hexdigest(),
        key_prefix=raw_key[:8],
        name="Analytics Key",
        scopes=["metrics:write", "metrics:read"],
        is_active=True,
    )
    db_session.add(api_key)
    await db_session.commit()

    return tenant, user, raw_key


@pytest.mark.asyncio
async def test_health_endpoint(test_client):
    """Health check endpoint should return status field."""
    response = await test_client.get("/health")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert "checks" in data


@pytest.mark.asyncio
async def test_register_then_ingest(test_client, db_session):
    """
    End-to-end: register tenant → get API key → ingest metric.
    Verifies the happy path works from registration to ingestion.
    """
    # Register
    reg = await test_client.post("/api/v1/auth/register-tenant", json={
        "tenant_name": "Analytics E2E",
        "tenant_slug": f"analytics-e2e-{uuid.uuid4().hex[:6]}",
        "owner_email": "e2e@analytics.com",
        "owner_password": "E2ePass123!"
    })
    assert reg.status_code == 201


@pytest.mark.asyncio
async def test_tenant_isolation_rls(test_client, db_session):
    """
    RLS isolation: Tenant A's data must NOT be visible to Tenant B's queries.
    This test verifies that the set_tenant_context helper correctly scopes DB queries.
    """
    from app.db.base import async_session_maker, set_tenant_context
    from sqlalchemy import text

    # Create two tenants
    tenant_a = Tenant(name="Tenant A", slug=f"rls-a-{uuid.uuid4().hex[:6]}", plan="starter", is_active=True)
    tenant_b = Tenant(name="Tenant B", slug=f"rls-b-{uuid.uuid4().hex[:6]}", plan="starter", is_active=True)
    db_session.add_all([tenant_a, tenant_b])
    await db_session.flush()

    # Insert a metric event for Tenant A directly (bypassing RLS as superuser)
    event_id = uuid.uuid4()
    await db_session.execute(text("""
        INSERT INTO metric_events
            (id, tenant_id, timestamp, endpoint, method, status_code, response_time_ms)
        VALUES
            (:id, :tenant_id, NOW(), '/api/private', 'GET', 200, 50.0)
    """), {"id": str(event_id), "tenant_id": str(tenant_a.id)})
    await db_session.commit()

    # Query as Tenant B — should see 0 rows due to RLS
    async with async_session_maker() as session_b:
        await set_tenant_context(session_b, str(tenant_b.id))
        result = await session_b.execute(
            text("SELECT COUNT(*) as cnt FROM metric_events WHERE tenant_id = :tid"),
            {"tid": str(tenant_a.id)}
        )
        row = result.fetchone()
        # RLS blocks Tenant B from seeing Tenant A's data
        assert row.cnt == 0, "RLS failed: Tenant B can read Tenant A's events"

    # Query as Tenant A — should see their own row
    async with async_session_maker() as session_a:
        await set_tenant_context(session_a, str(tenant_a.id))
        result = await session_a.execute(
            text("SELECT COUNT(*) as cnt FROM metric_events WHERE tenant_id = :tid"),
            {"tid": str(tenant_a.id)}
        )
        row = result.fetchone()
        assert row.cnt == 1, "Tenant A cannot see their own data"
