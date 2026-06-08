"""
Stripe Webhook endpoint.

Security: All requests are validated against the Stripe webhook signature
using the STRIPE_WEBHOOK_SECRET. Unsigned or tampered requests are rejected
with 400 before any processing occurs.

Idempotency: Uses the Stripe event ID as the idempotency key — duplicate
webhook deliveries (Stripe retries) are safely ignored.

Handled events:
- invoice.payment_succeeded     → mark subscription active
- invoice.payment_failed        → mark subscription past_due
- customer.subscription.updated → sync plan/status changes
- customer.subscription.deleted → mark subscription cancelled
"""
import json
import logging
import time
import hmac
import hashlib
from typing import Optional

from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config import settings
from app.db.base import get_db_session
from app.models.subscription import Subscription
from app.core.idempotency import redis_client as idempotency_redis
from app.utils.audit import AuditLogger

logger = logging.getLogger(__name__)

router = APIRouter()

STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300  # 5 minutes


def _verify_stripe_signature(payload_bytes: bytes, sig_header: str, secret: str) -> None:
    """
    Validates the stripe-signature header using the same algorithm Stripe uses.
    Raises HTTPException 400 if invalid or timestamp is stale.

    Stripe signature format:
    t=<timestamp>,v1=<hmac_sha256_hex>[,v1=<additional_signatures>]
    """
    try:
        parts = dict(item.split("=", 1) for item in sig_header.split(","))
        timestamp = int(parts["t"])
        v1_signatures = [
            v for k, v in parts.items() if k == "v1"
        ]
    except (KeyError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid stripe-signature header")

    # Reject stale timestamps
    if abs(time.time() - timestamp) > STRIPE_WEBHOOK_TOLERANCE_SECONDS:
        raise HTTPException(
            status_code=400,
            detail="Webhook timestamp too old (possible replay attack)"
        )

    signed_payload = f"{timestamp}.".encode() + payload_bytes
    expected_mac = hmac.new(
        secret.encode(), signed_payload, hashlib.sha256
    ).hexdigest()

    if not any(
        hmac.compare_digest(expected_mac, sig) for sig in v1_signatures
    ):
        raise HTTPException(
            status_code=400,
            detail="Webhook signature verification failed"
        )


@router.post(
    "/stripe",
    status_code=status.HTTP_200_OK,
    summary="Stripe webhook receiver",
    include_in_schema=False,  # Don't expose webhook in public docs
)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Receives and validates Stripe webhook events.
    Idempotent: duplicate events (same Stripe event ID) are silently ignored.
    """
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook not configured")

    # Read raw body for signature verification
    payload_bytes = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    # Verify signature BEFORE deserializing
    _verify_stripe_signature(payload_bytes, sig_header, settings.STRIPE_WEBHOOK_SECRET)

    try:
        event = json.loads(payload_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_id = event.get("id", "")
    event_type = event.get("type", "")

    # ── Idempotency: skip duplicate event deliveries ──────────────────────────
    idempotency_key = f"stripe_webhook:{event_id}"
    already_processed = await idempotency_redis.get(idempotency_key)
    if already_processed:
        logger.info("Stripe event already processed: %s", event_id)
        return {"received": True, "idempotent": True}

    logger.info("Processing Stripe event: %s (%s)", event_type, event_id)

    # ── Route to handlers ─────────────────────────────────────────────────────
    try:
        if event_type == "invoice.payment_succeeded":
            await _handle_payment_succeeded(event["data"]["object"], db)

        elif event_type == "invoice.payment_failed":
            await _handle_payment_failed(event["data"]["object"], db)

        elif event_type == "customer.subscription.updated":
            await _handle_subscription_updated(event["data"]["object"], db)

        elif event_type == "customer.subscription.deleted":
            await _handle_subscription_deleted(event["data"]["object"], db)

        else:
            logger.debug("Unhandled Stripe event type: %s", event_type)

    except Exception as exc:
        logger.exception("Error handling Stripe event %s: %s", event_id, exc)
        # Return 200 to prevent Stripe from retrying — log for manual review
        return {"received": True, "error": str(exc)}

    # Mark as processed (24h window matches Stripe's retry window)
    await idempotency_redis.set(idempotency_key, "PROCESSED", ex=86400)
    return {"received": True}


# ── Event handlers ────────────────────────────────────────────────────────────

async def _get_subscription_by_stripe_id(
    stripe_sub_id: str, db: AsyncSession
) -> Optional[Subscription]:
    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == stripe_sub_id
        )
    )
    return result.scalar_one_or_none()


async def _handle_payment_succeeded(invoice: dict, db: AsyncSession) -> None:
    stripe_sub_id = invoice.get("subscription")
    if not stripe_sub_id:
        return
    sub = await _get_subscription_by_stripe_id(stripe_sub_id, db)
    if not sub:
        logger.warning("Subscription not found for stripe_id=%s", stripe_sub_id)
        return

    before = {"status": sub.status}
    sub.status = "active"
    await db.commit()

    await AuditLogger.log(
        db=db,
        tenant_id=str(sub.tenant_id),
        user_id=None,
        action="subscription.payment_succeeded",
        resource_type="subscription",
        resource_id=str(sub.id),
        before_state=before,
        after_state={"status": "active"},
    )
    logger.info("Subscription %s marked active after payment succeeded", sub.id)


async def _handle_payment_failed(invoice: dict, db: AsyncSession) -> None:
    stripe_sub_id = invoice.get("subscription")
    if not stripe_sub_id:
        return
    sub = await _get_subscription_by_stripe_id(stripe_sub_id, db)
    if not sub:
        return

    before = {"status": sub.status}
    sub.status = "past_due"
    await db.commit()

    await AuditLogger.log(
        db=db,
        tenant_id=str(sub.tenant_id),
        user_id=None,
        action="subscription.payment_failed",
        resource_type="subscription",
        resource_id=str(sub.id),
        before_state=before,
        after_state={"status": "past_due"},
    )
    logger.warning("Subscription %s marked past_due after payment failed", sub.id)


async def _handle_subscription_updated(stripe_sub: dict, db: AsyncSession) -> None:
    stripe_sub_id = stripe_sub.get("id")
    sub = await _get_subscription_by_stripe_id(stripe_sub_id, db)
    if not sub:
        return

    before = {"status": sub.status, "plan": sub.plan}

    # Map Stripe status to our status enum
    status_map = {
        "active": "active",
        "past_due": "past_due",
        "canceled": "cancelled",
        "trialing": "trialing",
    }
    new_status = status_map.get(stripe_sub.get("status", ""), sub.status)
    sub.status = new_status

    await db.commit()

    await AuditLogger.log(
        db=db,
        tenant_id=str(sub.tenant_id),
        user_id=None,
        action="subscription.updated",
        resource_type="subscription",
        resource_id=str(sub.id),
        before_state=before,
        after_state={"status": new_status},
    )


async def _handle_subscription_deleted(stripe_sub: dict, db: AsyncSession) -> None:
    stripe_sub_id = stripe_sub.get("id")
    sub = await _get_subscription_by_stripe_id(stripe_sub_id, db)
    if not sub:
        return

    before = {"status": sub.status}
    sub.status = "cancelled"
    await db.commit()

    await AuditLogger.log(
        db=db,
        tenant_id=str(sub.tenant_id),
        user_id=None,
        action="subscription.cancelled",
        resource_type="subscription",
        resource_id=str(sub.id),
        before_state=before,
        after_state={"status": "cancelled"},
    )
    logger.info("Subscription %s cancelled via Stripe webhook", sub.id)
