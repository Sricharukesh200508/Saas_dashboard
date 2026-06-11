import asyncio
import uuid
import random
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, delete
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

async def clear_existing_data(session):
    # Find existing user by email
    stmt = select(User).where(User.email == DEMO_EMAIL)
    result = await session.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        tenant_id = existing_user.tenant_id
        # Delete everything for this tenant
        print(f"Clearing existing data for tenant {tenant_id}...")
        await session.execute(delete(MetricAggregate).where(MetricAggregate.tenant_id == tenant_id))
        await session.execute(delete(MetricEvent).where(MetricEvent.tenant_id == tenant_id))
        await session.execute(delete(AuditLog).where(AuditLog.tenant_id == tenant_id))
        await session.execute(delete(Alert).where(Alert.tenant_id == tenant_id))
        await session.execute(delete(Integration).where(Integration.tenant_id == tenant_id))
        await session.execute(delete(WebhookDelivery).where(WebhookDelivery.tenant_id == tenant_id))
        await session.execute(delete(WebhookEndpoint).where(WebhookEndpoint.tenant_id == tenant_id))
        await session.execute(delete(ApiKey).where(ApiKey.tenant_id == tenant_id))
        await session.execute(delete(Subscription).where(Subscription.tenant_id == tenant_id))
        await session.execute(delete(User).where(User.tenant_id == tenant_id))
        await session.execute(delete(Tenant).where(Tenant.id == tenant_id))
        await session.flush()

async def generate_demo_data():
    async with async_session_maker() as session:
        await clear_existing_data(session)
        
        # Create Tenant
        tenant_id = uuid.uuid4()
        tenant = Tenant(
            id=tenant_id,
            name="Acme Corp Demo",
            slug="acme-corp-demo"
        )
        session.add(tenant)
        await session.flush()

        # Create User
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
        await session.flush()

        # Subscription
        subscription = Subscription(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            stripe_customer_id="cus_demo" + str(random.randint(1000, 9999)),
            stripe_subscription_id="sub_demo" + str(random.randint(1000, 9999)),
            plan="enterprise",
            status="active",
            current_period_end=datetime.now(timezone.utc) + timedelta(days=300)
        )
        session.add(subscription)
        await session.flush()

        # API Keys
        api_keys = []
        for name, scopes in [
            ("Production API Key", ["metrics:read", "metrics:write", "webhooks:read"]),
            ("Staging Key", ["metrics:read", "metrics:write"]),
            ("Read-only key", ["metrics:read"])
        ]:
            raw_key = "nx_live_" + secrets.token_urlsafe(32)
            key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
            api_key = ApiKey(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                user_id=user_id,
                name=name,
                key_hash=key_hash,
                key_prefix=raw_key[:8],
                scopes=scopes,
                is_active=True
            )
            session.add(api_key)
            api_keys.append(api_key)
        await session.flush()

        # Integrations
        integrations = [
            Integration(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                provider="slack",
                credentials={"token": "xoxb-demo-token"},
                is_active=True
            ),
            Integration(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                provider="github",
                credentials={"token": "ghp_demo_token"},
                is_active=True
            ),
            Integration(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                provider="pagerduty",
                credentials={"token": "pd_demo_token"},
                is_active=False
            )
        ]
        session.add_all(integrations)
        await session.flush()

        # Alerts
        alerts = [
            Alert(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                name="High API Error Rate (> 5%)",
                metric="error_rate",
                operator="gt",
                threshold=5.0,
                window_minutes=5,
                channels={"slack": ["#alerts-critical"]},
                is_active=True
            ),
            Alert(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                name="Response Time > 1000ms",
                metric="response_time",
                operator="gt",
                threshold=1000.0,
                window_minutes=15,
                channels={"slack": ["#alerts"], "email": ["oncall@acmecorp.com"]},
                is_active=True
            ),
            Alert(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                name="API Calls Drop",
                metric="api_calls",
                operator="lt",
                threshold=100.0,
                window_minutes=60,
                channels={"slack": ["#devops"]},
                is_active=False
            )
        ]
        session.add_all(alerts)
        await session.flush()

        # Webhooks
        webhooks = []
        for i in range(3):
            webhook = WebhookEndpoint(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                name=f"Endpoint {i+1}",
                url=f"https://api.acmecorp.com/webhooks/{i+1}",
                events=["*"] if i == 0 else ["api_key.created", "alert.triggered"],
                is_active=True
            )
            session.add(webhook)
            webhooks.append(webhook)
        await session.flush()

        # Webhook Deliveries (Simulating 100 recent deliveries)
        events = ["api_key.created", "alert.triggered", "user.login", "subscription.updated"]
        for _ in range(100):
            endpoint = random.choice(webhooks)
            success = random.random() > 0.1  # 90% success rate
            status = 200 if success else random.choice([400, 401, 404, 500, 503])
            
            delivery_time = datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 72), minutes=random.randint(0, 60))
            
            delivery = WebhookDelivery(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                webhook_endpoint_id=endpoint.id,
                event_type=random.choice(events),
                url=endpoint.url,
                request_payload={"event": "simulated_event"},
                response_status=status,
                response_body="OK" if success else "Error",
                success=success,
                created_at=delivery_time
            )
            session.add(delivery)
        await session.flush()

        # Audit Logs (50 records)
        actions = ["user.login", "api_key.created", "api_key.revoked", "webhook.created", "integration.updated", "alert.created"]
        resources = ["user", "api_key", "webhook", "integration", "alert"]
        for _ in range(50):
            action = random.choice(actions)
            log_time = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30), hours=random.randint(0, 24))
            
            audit_log = AuditLog(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                user_id=user_id,
                action=action,
                resource_type=random.choice(resources),
                resource_id=str(uuid.uuid4()),
                before_state=None,
                after_state={"status": "updated"} if random.random() > 0.5 else None,
                ip_address=f"192.168.1.{random.randint(10, 250)}",
                created_at=log_time
            )
            session.add(audit_log)
        await session.flush()

        # Metric Aggregates (30 days of data, 24 hours a day, multiple endpoints)
        endpoints = ["/api/v1/users", "/api/v1/payments", "/api/v1/auth", "/api/v2/data"]
        
        # Base traffic pattern simulating a diurnal cycle + some noise
        for day in range(30):
            date_offset = datetime.now(timezone.utc) - timedelta(days=30 - day)
            for hour in range(24):
                # Peak hours 9 AM to 5 PM UTC
                is_peak = 9 <= hour <= 17
                base_volume = random.randint(5000, 10000) if is_peak else random.randint(500, 2000)
                
                # Add random spikes
                if random.random() > 0.95:
                    base_volume *= random.randint(2, 5)
                
                for endpoint in endpoints:
                    endpoint_volume = int(base_volume * random.uniform(0.1, 1.0))
                    error_rate = random.uniform(0.001, 0.05) if not is_peak else random.uniform(0.01, 0.08)
                    
                    if random.random() > 0.98: # Spike errors
                        error_rate = random.uniform(0.1, 0.4)
                        
                    error_calls = int(endpoint_volume * error_rate)
                    
                    avg_resp = random.uniform(20.0, 80.0)
                    if error_rate > 0.1: # Higher latency during high errors
                        avg_resp += random.uniform(50.0, 200.0)
                        
                    p95 = avg_resp * random.uniform(1.2, 2.0)
                    p99 = p95 * random.uniform(1.2, 2.5)
                    
                    hour_dt = date_offset.replace(hour=hour, minute=0, second=0, microsecond=0)
                    
                    agg = MetricAggregate(
                        tenant_id=tenant_id,
                        bucket=hour_dt,
                        granularity="hour",
                        endpoint=endpoint,
                        total_calls=endpoint_volume,
                        error_calls=error_calls,
                        avg_response_ms=avg_resp,
                        p95_response_ms=p95,
                        p99_response_ms=p99
                    )
                    session.add(agg)
        
        await session.commit()
        print(f"==== DEMO DATA GENERATED SUCCESSFULLY ====")
        print(f"Tenant ID: {tenant_id}")
        print(f"Login Email: {DEMO_EMAIL}")
        print(f"Login Password: {DEMO_PASSWORD}")
        print(f"==========================================")

if __name__ == "__main__":
    asyncio.run(generate_demo_data())
