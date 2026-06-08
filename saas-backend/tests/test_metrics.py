"""
Metrics ingestion tests — API key auth, idempotency, batch, rate limiting.
"""
import hashlib
import pytest

from app.models.api_key import ApiKey
from app.models.tenant import Tenant
from app.models.user import User
from app.core.security import get_password_hash


async def _create_tenant_and_key(db_session) -> tuple[str, str]:
    """
    Helper: create a Tenant + User + ApiKey in the test DB.
    Returns (tenant_id_str, raw_api_key_str)
    """
    import uuid, secrets

    tenant = Tenant(name="Test Tenant", slug=f"test-{uuid.uuid4().hex[:8]}", plan="starter", is_active=True)
    db_session.add(tenant)
    await db_session.flush()

    user = User(
        tenant_id=tenant.id,
        email=f"user-{uuid.uuid4().hex[:6]}@test.com",
        hashed_password=get_password_hash("testpass"),
        role="owner",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    raw_key = secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    api_key = ApiKey(
        tenant_id=tenant.id,
        user_id=user.id,
        key_hash=key_hash,
        key_prefix=raw_key[:8],
        name="Test Key",
        scopes=["metrics:write"],
        is_active=True,
    )
    db_session.add(api_key)
    await db_session.commit()

    return str(tenant.id), raw_key


@pytest.mark.asyncio
async def test_ingest_missing_api_key(test_client):
    """Missing X-API-Key header returns 422 (validation error)."""
    response = await test_client.post("/api/v1/metrics/ingest", json={
        "endpoint": "/api/test",
        "method": "GET",
        "status_code": 200,
        "response_time_ms": 45.2,
        "timestamp": "2026-01-01T00:00:00Z"
    })
    # FastAPI returns 422 for missing required header
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ingest_invalid_api_key(test_client):
    """Invalid X-API-Key returns 401."""
    response = await test_client.post(
        "/api/v1/metrics/ingest",
        json={
            "endpoint": "/api/test",
            "method": "GET",
            "status_code": 200,
            "response_time_ms": 45.2,
            "timestamp": "2026-01-01T00:00:00Z"
        },
        headers={"X-API-Key": "invalid-key-that-does-not-exist"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_ingest_valid_api_key(test_client, db_session):
    """Valid API key with correct scope returns 202 Accepted."""
    _tenant_id, raw_key = await _create_tenant_and_key(db_session)

    response = await test_client.post(
        "/api/v1/metrics/ingest",
        json={
            "endpoint": "/api/orders",
            "method": "POST",
            "status_code": 201,
            "response_time_ms": 120.5,
            "bytes_transferred": 1024,
            "timestamp": "2026-01-01T12:00:00Z"
        },
        headers={"X-API-Key": raw_key},
    )
    assert response.status_code == 202
    assert response.json()["message"] == "Accepted"


@pytest.mark.asyncio
async def test_ingest_idempotency(test_client, db_session):
    """Same Idempotency-Key is rejected as already-processed on second call."""
    _tenant_id, raw_key = await _create_tenant_and_key(db_session)
    payload = {
        "endpoint": "/api/pay",
        "method": "POST",
        "status_code": 200,
        "response_time_ms": 80.0,
        "timestamp": "2026-01-01T13:00:00Z"
    }
    headers = {"X-API-Key": raw_key, "Idempotency-Key": "test-idem-key-abc123"}

    r1 = await test_client.post("/api/v1/metrics/ingest", json=payload, headers=headers)
    r2 = await test_client.post("/api/v1/metrics/ingest", json=payload, headers=headers)

    assert r1.status_code == 202
    assert r2.status_code == 200
    assert r2.json().get("idempotent") is True


@pytest.mark.asyncio
async def test_batch_ingest(test_client, db_session):
    """Batch ingest of multiple events returns accepted count."""
    _tenant_id, raw_key = await _create_tenant_and_key(db_session)

    events = [
        {
            "endpoint": f"/api/resource/{i}",
            "method": "GET",
            "status_code": 200,
            "response_time_ms": float(i * 10),
            "timestamp": f"2026-01-01T{i:02d}:00:00Z"
        }
        for i in range(5)
    ]

    response = await test_client.post(
        "/api/v1/metrics/ingest/batch",
        json={"events": events},
        headers={"X-API-Key": raw_key},
    )
    assert response.status_code == 202
    data = response.json()
    assert data["accepted"] == 5
    assert data["rejected"] == 0


@pytest.mark.asyncio
async def test_api_key_wrong_scope(test_client, db_session):
    """API key without metrics:write scope returns 403."""
    import uuid, secrets
    tenant = Tenant(name="Scope Test", slug=f"scope-{uuid.uuid4().hex[:8]}", plan="starter", is_active=True)
    db_session.add(tenant)
    await db_session.flush()

    user = User(
        tenant_id=tenant.id,
        email="scope@test.com",
        hashed_password=get_password_hash("pass"),
        role="viewer",
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
        name="Read Only Key",
        scopes=["metrics:read"],  # wrong scope
        is_active=True,
    )
    db_session.add(api_key)
    await db_session.commit()

    response = await test_client.post(
        "/api/v1/metrics/ingest",
        json={
            "endpoint": "/api/x",
            "method": "GET",
            "status_code": 200,
            "response_time_ms": 10.0,
            "timestamp": "2026-01-01T00:00:00Z"
        },
        headers={"X-API-Key": raw_key},
    )
    assert response.status_code == 403
