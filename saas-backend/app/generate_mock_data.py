import asyncio
import uuid
import random
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.db.base import async_session_maker
from app.models.tenant import Tenant
from app.models.user import User
from app.models.api_key import ApiKey
from app.models.webhook import WebhookEndpoint, WebhookDelivery
from app.models.alert import Alert
from app.models.audit_log import AuditLog
from app.models.metric_event import MetricAggregate

async def generate_mock_data():
    async with async_session_maker() as session:
        # Find user
        result = await session.execute(select(User).where(User.email == "admin@acmecorp.com"))
        user = result.scalars().first()
        if not user:
            print("User admin@acmecorp.com not found. Please run seed.py first.")
            return

        tenant_id = user.tenant_id

        print(f"Found tenant {tenant_id}. Generating mock data...")

        # Create 5 API Keys
        for i in range(5):
            raw_key = "nx_live_" + secrets.token_urlsafe(32)
            key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
            api_key = ApiKey(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                user_id=user.id,
                name=f"Mock Key {i+1}",
                key_hash=key_hash,
                key_prefix=raw_key[:8],
                scopes=["metrics:read", "metrics:write"] if i % 2 == 0 else ["metrics:read"],
                is_active=True,
                last_used_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 48))
            )
            session.add(api_key)

        # Create 3 Webhooks and deliveries
        for i in range(3):
            webhook = WebhookEndpoint(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                name=f"Mock Webhook {i+1}",
                url=f"https://api.example.com/webhook/{i+1}",
                events=["*"],
                is_active=True
            )
            session.add(webhook)
            await session.flush()
            
            for j in range(10):
                delivery = WebhookDelivery(
                    id=uuid.uuid4(),
                    tenant_id=tenant_id,
                    webhook_endpoint_id=webhook.id,
                    event_type="api_key.created",
                    url=webhook.url,
                    request_payload={"event": "api_key.created"},
                    response_status=200 if random.random() > 0.2 else 500,
                    response_body="OK" if random.random() > 0.2 else "Error",
                    success=True if random.random() > 0.2 else False,
                    created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 72))
                )
                session.add(delivery)

        # Create 5 Alerts
        metrics = ["api_calls", "error_rate", "response_time"]
        for i in range(5):
            alert = Alert(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                name=f"Mock Alert {i+1}",
                metric=random.choice(metrics),
                operator="gt",
                threshold=float(random.randint(10, 100)),
                window_minutes=5,
                channels={"slack": ["#alerts"]},
                is_active=True
            )
            session.add(alert)

        # Create 50 Audit Logs
        actions = ["user.login", "api_key.created", "webhook.updated", "alert.created", "subscription.updated"]
        for i in range(50):
            audit_log = AuditLog(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                user_id=user.id,
                action=random.choice(actions),
                resource_type="system",
                ip_address=f"192.168.1.{random.randint(1, 255)}",
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 168))
            )
            session.add(audit_log)

        # Create 30 days of Metric Aggregates (hourly)
        endpoints = ["/api/v1/users", "/api/v1/metrics", "/api/v1/auth", "/api/v1/billing"]
        for days_ago in range(30):
            for hour in range(24):
                dt = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hour)
                hour_dt = dt.replace(minute=0, second=0, microsecond=0)
                
                for endpoint in endpoints:
                    # Randomize traffic pattern slightly
                    base_calls = random.randint(10, 500)
                    if hour in [9, 10, 11, 13, 14, 15]: # Business hours spike
                        base_calls *= 3
                        
                    error_rate = random.uniform(0, 0.05)
                    errors = int(base_calls * error_rate)
                    
                    agg = MetricAggregate(
                        tenant_id=tenant_id,
                        bucket=hour_dt,
                        granularity="hour",
                        endpoint=endpoint,
                        total_calls=base_calls,
                        error_calls=errors,
                        success_calls=base_calls - errors,
                        avg_response_ms=random.uniform(20.0, 150.0),
                        p95_response_ms=random.uniform(100.0, 300.0),
                        p99_response_ms=random.uniform(200.0, 800.0)
                    )
                    session.add(agg)

        await session.commit()
        print("Mock data generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate_mock_data())
