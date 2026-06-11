import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone

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

async def seed_data():
    async with async_session_maker() as session:
        # Create Tenant
        tenant_id = uuid.uuid4()
        tenant = Tenant(
            id=tenant_id,
            name="Acme Corp",
            slug="acme-corp"
        )
        session.add(tenant)
        await session.flush()

        # Create User
        user_id = uuid.uuid4()
        user = User(
            id=user_id,
            tenant_id=tenant_id,
            email="admin@acmecorp.com",
            hashed_password=get_password_hash("password123"),
            role="owner",
            is_active=True
        )
        session.add(user)
        await session.flush()

        # Create Subscription
        subscription = Subscription(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            stripe_customer_id="cus_mock123",
            stripe_subscription_id="sub_mock123",
            plan="pro",
            status="active",
            current_period_end=datetime.now(timezone.utc) + timedelta(days=30)
        )
        session.add(subscription)
        await session.flush()

        # Create API Keys
        import hashlib
        import secrets
        
        raw_key = "nx_live_" + secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        
        api_key = ApiKey(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            user_id=user_id,
            name="Production Key",
            key_hash=key_hash,
            key_prefix=raw_key[:8],
            scopes=["metrics:read", "metrics:write"],
            is_active=True
        )
        session.add(api_key)
        await session.flush()

        # Create Webhooks
        webhook = WebhookEndpoint(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            name="Main Endpoint",
            url="https://api.acmecorp.com/webhooks/nexus",
            events=["*"],
            is_active=True
        )
        session.add(webhook)
        await session.flush()

        webhook_delivery = WebhookDelivery(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            webhook_endpoint_id=webhook.id,
            event_type="api_key.created",
            url=webhook.url,
            request_payload={"event": "api_key.created"},
            response_status=200,
            response_body="OK",
            success=True
        )
        session.add(webhook_delivery)
        await session.flush()

        # Create Integrations
        integration_slack = Integration(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            provider="slack",
            credentials={"token": "xoxb-mock-token"},
            is_active=True
        )
        integration_github = Integration(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            provider="github",
            credentials={"token": "ghp_mock_token"},
            is_active=True
        )
        session.add_all([integration_slack, integration_github])
        await session.flush()

        # Create Alerts
        alert = Alert(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            name="High API Errors",
            metric="error_rate",
            operator="gt",
            threshold=50.0,
            window_minutes=5,
            channels={"slack": ["#alerts", "#devops"]},
            is_active=True
        )
        session.add(alert)
        await session.flush()

        # Create Audit Logs
        audit_log = AuditLog(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            user_id=user_id,
            action="user.created",
            resource_type="user",
            resource_id=str(user_id),
            before_state=None,
            after_state={"email": "admin@acmecorp.com", "role": "owner"},
            ip_address="192.168.1.100"
        )
        session.add(audit_log)
        await session.flush()

        # Create some Metric Aggregates so they show up
        for i in range(24):
            dt = datetime.now(timezone.utc) - timedelta(hours=i)
            # Truncate to hour
            hour_dt = dt.replace(minute=0, second=0, microsecond=0)
            agg = MetricAggregate(
                tenant_id=tenant_id,
                bucket=hour_dt,
                granularity="hour",
                endpoint="/api/v1/users",
                total_calls=random.randint(100, 1000),
                error_calls=random.randint(0, 10),
                avg_response_ms=random.uniform(50.0, 100.0),
                p95_response_ms=random.uniform(100.0, 200.0),
                p99_response_ms=random.uniform(200.0, 500.0)
            )
            session.add(agg)

        await session.commit()
        print(f"Data seeded successfully!")
        print(f"Tenant ID: {tenant_id}")
        print(f"Login Email: admin@acmecorp.com")
        print(f"Login Password: password123")

if __name__ == "__main__":
    asyncio.run(seed_data())
