import asyncio
import uuid
import random
import time
import httpx
from datetime import datetime, timezone
import hashlib

from sqlalchemy import select
from app.db.base import async_session_maker
from app.models.tenant import Tenant
from app.models.user import User
from app.models.api_key import ApiKey

DEMO_EMAIL = "demo@acmecorp.com"
KNOWN_RAW_KEY = "nx_live_demo_simulator_secret_key"

async def setup_api_key():
    async with async_session_maker() as session:
        user = (await session.execute(select(User).where(User.email == DEMO_EMAIL))).scalar_one_or_none()
        if not user:
            print("Demo user not found!")
            return None
        
        # Check if key exists
        key_hash = hashlib.sha256(KNOWN_RAW_KEY.encode()).hexdigest()
        existing = (await session.execute(select(ApiKey).where(ApiKey.key_hash == key_hash))).scalar_one_or_none()
        if existing:
            return KNOWN_RAW_KEY

        # Create new key
        api_key = ApiKey(
            id=uuid.uuid4(),
            tenant_id=user.tenant_id,
            user_id=user.id,
            name="Traffic Simulator Key",
            key_hash=key_hash,
            key_prefix=KNOWN_RAW_KEY[:8],
            scopes=["metrics:write"],
            is_active=True
        )
        session.add(api_key)
        await session.commit()
        return KNOWN_RAW_KEY

def generate_batch(size=5):
    endpoints = ["/api/v1/users", "/api/v1/payments", "/api/v1/auth", "/api/v2/data"]
    events = []
    for _ in range(size):
        endpoint = random.choice(endpoints)
        method = random.choice(["GET", "POST", "PUT"])
        status = 200 if random.random() > 0.05 else random.choice([400, 401, 404, 500])
        rt = random.uniform(20.0, 150.0)
        events.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "endpoint": endpoint,
            "method": method,
            "status_code": status,
            "response_time_ms": rt,
            "request_size_bytes": random.randint(100, 1000),
            "response_size_bytes": random.randint(200, 5000),
            "source_ip": f"192.168.1.{random.randint(10,250)}"
        })
    return {"events": events}

async def run_simulator():
    api_key = await setup_api_key()
    if not api_key:
        return
    
    print(f"Starting traffic simulator using API Key: {api_key}")
    headers = {"X-API-Key": api_key}
    
    # Use standard requests since we are testing
    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            batch = generate_batch(random.randint(2, 8))
            try:
                # Assuming the container is named "api" in docker-compose network
                resp = await client.post("http://api:8000/api/v1/metrics/ingest/batch", json=batch, headers=headers)
                print(f"Ingested {len(batch['events'])} events: {resp.status_code}")
            except Exception as e:
                print(f"Error: {e}")
            await asyncio.sleep(random.uniform(1.0, 3.0))

if __name__ == "__main__":
    asyncio.run(run_simulator())
