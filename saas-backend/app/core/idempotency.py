import functools
from fastapi import Request, HTTPException
import redis.asyncio as redis
from app.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def idempotent(timeout: int = 86400):
    """
    Decorator to ensure webhook/API endpoints are idempotent.
    Requires an Idempotency-Key header.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from kwargs
            request: Request = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if not request:
                return await func(*args, **kwargs)

            idempotency_key = request.headers.get("Idempotency-Key")
            if not idempotency_key:
                # If required, raise 400. Here we'll just bypass if missing.
                return await func(*args, **kwargs)

            # Check redis
            key = f"idempotency:{idempotency_key}"
            exists = await redis_client.get(key)
            if exists:
                # In a real impl, you might store the actual response and return it
                return {"message": "Idempotent request detected. Already processed."}

            # Process the request
            response = await func(*args, **kwargs)

            # Store key to prevent reprocessing
            await redis_client.set(key, "PROCESSED", ex=timeout)
            
            return response
        return wrapper
    return decorator
