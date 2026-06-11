"""
Comprehensive full-data seed for demo@acmecorp.com account.
Populates ALL sections of the dashboard with rich random data.
"""
import asyncio
import uuid
import random
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, delete, text
from app.db.base import async_session_maker
from app.models.tenant import Tenant
from app.models.user import User
from app.models.subscription import Subscription
from app.models.api_key import ApiKey
from app.models.webhook import WebhookEndpoint, WebhookDelivery
from app.models.integration import Integration
from app.models.alert import Alert
from app.models.audit_log import AuditLog
from app.models.metric_event import MetricEvent, MetricAggregate
from app.core.security import get_password_hash

DEMO_EMAIL = "demo@acmecorp.com"
DEMO_PASSWORD = "password123"

ENDPOINTS = [
    "/api/v1/users",
    "/api/v1/payments",
    "/api/v1/auth/login",
    "/api/v1/orders",
    "/api/v2/products",
    "/api/v1/analytics",
    "/api/v1/subscriptions",
]


async def clear_and_seed():
    async with async_session_maker() as session:
        # ── Find & Clear existing demo account ───────────────────────────
        stmt = select(User).where(User.email == DEMO_EMAIL)
        result = await session.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            tid = existing_user.tenant_id
            print(f"Clearing existing data for tenant {tid}...")
            for tbl in [MetricAggregate, MetricEvent, AuditLog, Alert, Integration,
                        WebhookDelivery, WebhookEndpoint, ApiKey, Subscription, User]:
                await session.execute(delete(tbl).where(tbl.tenant_id == tid))
            await session.execute(delete(Tenant).where(Tenant.id == tid))
            await session.flush()

        # ── Tenant ───────────────────────────────────────────────────────
        tenant_id = uuid.uuid4()
        tenant = Tenant(id=tenant_id, name="Acme Corp", slug="acme-corp-demo")
        session.add(tenant)
        await session.flush()

        # ── User ─────────────────────────────────────────────────────────
        user_id = uuid.uuid4()
        user = User(
            id=user_id,
            tenant_id=tenant_id,
            email=DEMO_EMAIL,
            hashed_password=get_password_hash(DEMO_PASSWORD),
            role="owner",
            is_active=True
        )
        session.add(user)

        # Add 3 more team members
        for name, role in [("alice@acmecorp.com", "admin"), ("bob@acmecorp.com", "member"), ("carol@acmecorp.com", "viewer")]:
            session.add(User(
                id=uuid.uuid4(), tenant_id=tenant_id,
                email=name, hashed_password=get_password_hash("password123"),
                role=role, is_active=True
            ))
        await session.flush()

        # ── Subscription ─────────────────────────────────────────────────
        subscription = Subscription(
            id=uuid.uuid4(), tenant_id=tenant_id,
            stripe_customer_id=f"cus_demo{random.randint(10000,99999)}",
            stripe_subscription_id=f"sub_demo{random.randint(10000,99999)}",
            plan="pro", status="active",
            current_period_end=datetime.now(timezone.utc) + timedelta(days=25)
        )
        session.add(subscription)
        await session.flush()

        # ── API Keys ─────────────────────────────────────────────────────
        for name, scopes in [
            ("Production Key", ["metrics:read", "metrics:write", "webhooks:read"]),
            ("Staging Key",    ["metrics:read", "metrics:write"]),
            ("CI/CD Key",      ["metrics:read"]),
        ]:
            raw = f"nx_live_{secrets.token_urlsafe(32)}"
            session.add(ApiKey(
                id=uuid.uuid4(), tenant_id=tenant_id, user_id=user_id,
                name=name, key_hash=hashlib.sha256(raw.encode()).hexdigest(),
                key_prefix=raw[:8], scopes=scopes, is_active=True
            ))
        await session.flush()

        # ── Integrations ─────────────────────────────────────────────────
        for provider, active in [("slack", True), ("github", True), ("pagerduty", False)]:
            session.add(Integration(
                id=uuid.uuid4(), tenant_id=tenant_id, provider=provider,
                credentials={"token": f"demo_{provider}_token_{random.randint(1000,9999)}"},
                is_active=active
            ))
        await session.flush()

        # ── Alerts ───────────────────────────────────────────────────────
        for name, metric, op, thresh, win, channels in [
            ("High Error Rate", "error_rate", "gt", 5.0, 5,   {"slack": ["#alerts-critical"]}),
            ("High Response Time", "response_time", "gt", 500.0, 15, {"slack": ["#alerts"], "email": ["oncall@acmecorp.com"]}),
            ("API Call Volume Drop", "api_calls", "lt", 100.0, 60, {"slack": ["#devops"]}),
        ]:
            session.add(Alert(
                id=uuid.uuid4(), tenant_id=tenant_id, name=name, metric=metric,
                operator=op, threshold=thresh, window_minutes=win, channels=channels, is_active=True
            ))
        await session.flush()

        # ── Webhooks ─────────────────────────────────────────────────────
        webhooks = []
        for i, (wname, wevents) in enumerate([
            ("Production Endpoint", ["*"]),
            ("Staging Endpoint",    ["api_key.created", "alert.triggered"]),
            ("Data Pipeline Hook",  ["metric.ingested"]),
        ]):
            wh = WebhookEndpoint(
                id=uuid.uuid4(), tenant_id=tenant_id, name=wname,
                url=f"https://hooks.acmecorp.com/endpoint-{i+1}",
                events=wevents, is_active=True
            )
            session.add(wh)
            webhooks.append(wh)
        await session.flush()

        # Webhook Deliveries (120 records)
        events = ["api_key.created", "alert.triggered", "user.login", "subscription.updated", "metric.ingested"]
        for _ in range(120):
            wh = random.choice(webhooks)
            success = random.random() > 0.12
            status_code = 200 if success else random.choice([400, 401, 404, 500, 503])
            dt = datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 168), minutes=random.randint(0, 59))
            session.add(WebhookDelivery(
                id=uuid.uuid4(), tenant_id=tenant_id,
                webhook_endpoint_id=wh.id, event_type=random.choice(events),
                url=wh.url, request_payload={"event": random.choice(events), "data": {"id": str(uuid.uuid4())}},
                response_status=status_code,
                response_body="OK" if success else "Internal Server Error",
                success=success, created_at=dt
            ))
        await session.flush()

        # ── Audit Logs (60 records) ───────────────────────────────────────
        actions = ["user.login", "api_key.created", "api_key.revoked", "webhook.created", "integration.updated", "alert.created", "user.invited"]
        ips = [f"192.168.1.{i}" for i in range(10, 250)]
        for _ in range(60):
            action = random.choice(actions)
            dt = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30), hours=random.randint(0, 24))
            session.add(AuditLog(
                id=uuid.uuid4(), tenant_id=tenant_id, user_id=user_id,
                action=action, resource_type=action.split('.')[0],
                resource_id=str(uuid.uuid4()),
                before_state=None if random.random() > 0.5 else {"status": "inactive"},
                after_state={"status": "updated", "actor": DEMO_EMAIL} if random.random() > 0.3 else None,
                ip_address=random.choice(ips), created_at=dt
            ))
        await session.flush()

        # ── Metric Aggregates (30 days × 24 hours × all endpoints) ───────
        print("Seeding metric aggregates (this may take a moment)...")
        batch = []
        for day in range(30):
            date_base = datetime.now(timezone.utc) - timedelta(days=30 - day)
            for hour in range(24):
                is_peak = 9 <= hour <= 18
                base_vol = random.randint(8000, 15000) if is_peak else random.randint(800, 3000)
                # Occasional traffic spikes
                if random.random() > 0.97:
                    base_vol *= random.randint(3, 6)

                for endpoint in ENDPOINTS:
                    vol = int(base_vol * random.uniform(0.05, 1.0))
                    if vol < 10:
                        vol = 10
                    err_rate = random.uniform(0.005, 0.04)
                    if random.random() > 0.98:
                        err_rate = random.uniform(0.15, 0.45)  # incident spike
                    errors = int(vol * err_rate)
                    avg_ms = random.uniform(20.0, 80.0)
                    if err_rate > 0.1:
                        avg_ms += random.uniform(100.0, 400.0)  # degraded during incidents

                    p95_ms = avg_ms * random.uniform(1.5, 2.5)
                    p99_ms = p95_ms * random.uniform(1.3, 2.5)
                    bucket = date_base.replace(hour=hour, minute=0, second=0, microsecond=0)

                    batch.append(MetricAggregate(
                        tenant_id=tenant_id, bucket=bucket, granularity="hour",
                        endpoint=endpoint, total_calls=vol, error_calls=errors,
                        avg_response_ms=avg_ms, p95_response_ms=p95_ms, p99_response_ms=p99_ms
                    ))

                    # Flush in batches to avoid memory pressure
                    if len(batch) >= 500:
                        session.add_all(batch)
                        await session.flush()
                        batch = []

        if batch:
            session.add_all(batch)
            await session.flush()

        await session.commit()
        print("=" * 50)
        print("DEMO DATA SEEDED SUCCESSFULLY!")
        print(f"  Tenant: Acme Corp Demo")
        print(f"  Email:  {DEMO_EMAIL}")
        print(f"  Pass:   {DEMO_PASSWORD}")
        print(f"  Tenant ID: {tenant_id}")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(clear_and_seed())
