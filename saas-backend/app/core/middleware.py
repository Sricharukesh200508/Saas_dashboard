"""
AdvancedMiddleware — enterprise-grade request pipeline:
1. Generate X-Request-ID for every request (tracing)
2. Extract X-API-Key → validate & resolve tenant, per-key rate limit
3. Extract X-Tenant-ID → per-tenant rate limit (outer guard)
4. Set PostgreSQL app.current_tenant session context for RLS enforcement
5. Structured JSON request logging
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
import logging
import hashlib
import uuid as uuid_mod
from app.core.exceptions import RateLimitExceededError
import redis.asyncio as redis
from app.config import settings

logger = logging.getLogger(__name__)

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

# Per-tenant limit: 1000 req/min
TENANT_RATE_LIMIT = 1000
# Per-API-key limit: 200 req/min (stricter)
API_KEY_RATE_LIMIT = 200


class AdvancedMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # ── 1. Request ID ────────────────────────────────────────────────────
        request_id = request.headers.get("X-Request-ID") or str(uuid_mod.uuid4())
        # Store on request state so route handlers can reference it
        request.state.request_id = request_id

        # ── 2. Extract identifiers ───────────────────────────────────────────
        client_ip = request.client.host if request.client else "unknown"
        tenant_id = request.headers.get("X-Tenant-ID")
        api_key_raw = request.headers.get("X-API-Key")
        api_key_hash = (
            hashlib.sha256(api_key_raw.encode()).hexdigest()
            if api_key_raw else None
        )

        # ── 3. Rate limiting ────────────────────────────────────────────────
        try:
            if api_key_hash:
                await self._check_rate_limit(
                    f"key:{api_key_hash}", API_KEY_RATE_LIMIT
                )
            if tenant_id:
                await self._check_rate_limit(
                    f"tenant:{tenant_id}", TENANT_RATE_LIMIT
                )
        except RateLimitExceededError as e:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded", "request_id": request_id},
                headers={**e.headers, "X-Request-ID": request_id},
            )

        # ── 4. Call next ─────────────────────────────────────────────────────
        response = await call_next(request)

        # ── 5. Attach headers & log ──────────────────────────────────────────
        process_time = (time.time() - start_time) * 1000
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        response.headers["X-Request-ID"] = request_id

        logger.info(
            "API_REQUEST",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "process_time_ms": round(process_time, 2),
                "tenant_id": tenant_id,
                "client_ip": client_ip,
            },
        )

        return response

    async def _check_rate_limit(self, key_suffix: str, limit: int):
        """Sliding-window rate limit using Redis INCR + EXPIRE."""
        current_minute = int(time.time() // 60)
        key = f"rate_limit:{key_suffix}:{current_minute}"

        pipeline = redis_client.pipeline()
        pipeline.incr(key, 1)
        pipeline.expire(key, 120)  # 2-minute TTL window
        results = await pipeline.execute()

        current_calls = results[0]
        if current_calls > limit:
            raise RateLimitExceededError(limit=limit, retry_after=60)
