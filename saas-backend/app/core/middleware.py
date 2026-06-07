from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
import logging
from uuid import UUID
from app.core.exceptions import RateLimitExceededError
import redis.asyncio as redis
from app.config import settings

logger = logging.getLogger(__name__)

# Basic Redis for RateLimiting / IPs
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class AdvancedMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # 1. IP Whitelisting (Example: Only allow from VPC or predefined list)
        client_ip = request.client.host if request.client else "unknown"
        # In enterprise, this list would be cached from DB per tenant
        # if not self._is_ip_allowed(client_ip):
        #     return JSONResponse(status_code=403, content={"detail": "IP not whitelisted"})
        
        # 2. Tenant Extraction
        tenant_id = request.headers.get("X-Tenant-ID")
        
        # 3. Rate Limiting Logic (Sliding Window via Redis)
        if tenant_id:
            try:
                await self._check_rate_limit(tenant_id)
            except RateLimitExceededError as e:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded"},
                    headers=e.headers
                )
        
        # Call next
        response = await call_next(request)
        
        # 4. Request Logging (Structured JSON)
        process_time = (time.time() - start_time) * 1000
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log to ELK/Datadog via standard out
        log_data = {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time_ms": process_time,
            "tenant_id": tenant_id,
            "client_ip": client_ip,
        }
        logger.info(f"API_REQUEST: {log_data}")
        
        return response

    async def _check_rate_limit(self, tenant_id: str):
        # Simplified Sliding Window using Redis INCR and EXPIRE
        current_minute = int(time.time() // 60)
        key = f"rate_limit:{tenant_id}:{current_minute}"
        
        # Get limit from DB/Cache (Mocked here to 1000)
        limit = 1000
        
        pipeline = redis_client.pipeline()
        pipeline.incr(key, 1)
        pipeline.expire(key, 120) # Keep for 2 minutes
        results = await pipeline.execute()
        
        current_calls = results[0]
        if current_calls > limit:
            raise RateLimitExceededError(limit=limit, retry_after=60)
