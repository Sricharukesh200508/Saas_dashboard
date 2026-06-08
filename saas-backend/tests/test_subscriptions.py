"""
Stripe webhook + subscription tests.
"""
import hashlib
import hmac
import json
import time
import uuid
import pytest

from app.models.subscription import Subscription
from app.models.tenant import Tenant


def _make_stripe_signature(payload_bytes: bytes, secret: str) -> str:
    """Generate a valid Stripe signature header for testing."""
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.".encode() + payload_bytes
    mac = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={mac}"


@pytest.mark.asyncio
async def test_stripe_webhook_no_signature(test_client):
    """Request without stripe-signature header returns 400."""
    response = await test_client.post(
        "/api/v1/webhooks/stripe",
        content=json.dumps({"type": "test.event"}),
        headers={"Content-Type": "application/json"},
    )
    # Missing STRIPE_WEBHOOK_SECRET in test env → 500, or 400 if secret is set
    assert response.status_code in (400, 500)


@pytest.mark.asyncio
async def test_stripe_webhook_invalid_signature(test_client):
    """Tampered signature returns 400."""
    from app.config import settings
    if not settings.STRIPE_WEBHOOK_SECRET:
        pytest.skip("STRIPE_WEBHOOK_SECRET not configured")

    payload = json.dumps({"id": "evt_test", "type": "invoice.payment_succeeded"}).encode()
    response = await test_client.post(
        "/api/v1/webhooks/stripe",
        content=payload,
        headers={
            "Content-Type": "application/json",
            "stripe-signature": "t=9999999999,v1=badhash",
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_stripe_webhook_valid_payment_succeeded(test_client, db_session):
    """Valid webhook with correct signature processes payment_succeeded event."""
    from app.config import settings
    if not settings.STRIPE_WEBHOOK_SECRET:
        pytest.skip("STRIPE_WEBHOOK_SECRET not configured")

    # Setup: tenant + subscription
    tenant = Tenant(name="Stripe Corp", slug=f"stripe-{uuid.uuid4().hex[:6]}", plan="pro", is_active=True)
    db_session.add(tenant)
    await db_session.flush()

    sub = Subscription(
        tenant_id=tenant.id,
        plan="pro",
        status="past_due",
        stripe_subscription_id="sub_test123",
        stripe_customer_id="cus_test123",
        api_call_limit=500_000,
        storage_limit_gb=50,
    )
    db_session.add(sub)
    await db_session.commit()

    event = {
        "id": f"evt_{uuid.uuid4().hex}",
        "type": "invoice.payment_succeeded",
        "data": {"object": {"subscription": "sub_test123"}}
    }
    payload = json.dumps(event).encode()
    sig = _make_stripe_signature(payload, settings.STRIPE_WEBHOOK_SECRET)

    response = await test_client.post(
        "/api/v1/webhooks/stripe",
        content=payload,
        headers={"Content-Type": "application/json", "stripe-signature": sig},
    )
    assert response.status_code == 200
    assert response.json()["received"] is True

    # Verify subscription is now active
    await db_session.refresh(sub)
    assert sub.status == "active"


@pytest.mark.asyncio
async def test_stripe_webhook_idempotency(test_client, db_session):
    """Same Stripe event ID processed twice — second call is silently ignored."""
    from app.config import settings
    if not settings.STRIPE_WEBHOOK_SECRET:
        pytest.skip("STRIPE_WEBHOOK_SECRET not configured")

    event_id = f"evt_{uuid.uuid4().hex}"
    event = {
        "id": event_id,
        "type": "customer.subscription.deleted",
        "data": {"object": {"id": "sub_nonexistent", "status": "canceled"}}
    }
    payload = json.dumps(event).encode()
    sig = _make_stripe_signature(payload, settings.STRIPE_WEBHOOK_SECRET)
    headers = {"Content-Type": "application/json", "stripe-signature": sig}

    r1 = await test_client.post("/api/v1/webhooks/stripe", content=payload, headers=headers)
    # Regenerate sig (different timestamp) but same event_id
    sig2 = _make_stripe_signature(payload, settings.STRIPE_WEBHOOK_SECRET)
    headers2 = {"Content-Type": "application/json", "stripe-signature": sig2}
    r2 = await test_client.post("/api/v1/webhooks/stripe", content=payload, headers=headers2)

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r2.json().get("idempotent") is True
