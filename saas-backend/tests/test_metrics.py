import pytest
from datetime import datetime, timezone
import uuid

@pytest.mark.asyncio
async def test_ingest_single_metric(test_client):
    tenant_id = str(uuid.uuid4())
    event = {
        "endpoint": "/api/users",
        "method": "GET",
        "status_code": 200,
        "response_time_ms": 14.5,
        "bytes_transferred": 512,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    response = await test_client.post(
        "/api/v1/metrics/ingest", 
        json=event,
        headers={"X-Tenant-ID": tenant_id}
    )
    assert response.status_code == 202
    assert response.json()["message"] == "Accepted"
