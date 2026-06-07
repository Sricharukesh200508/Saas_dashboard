import contextlib
import redis.asyncio as redis
from app.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

@contextlib.asynccontextmanager
async def distributed_lock(lock_name: str, timeout: int = 10):
    """
    Acquires a distributed lock using Redis SET NX.
    Ensures that concurrent operations (like billing a tenant or upgrading a plan) don't conflict.
    """
    lock_key = f"lock:{lock_name}"
    acquired = await redis_client.set(lock_key, "1", nx=True, ex=timeout)
    
    if not acquired:
        raise Exception(f"Could not acquire lock for {lock_name}")
    
    try:
        yield
    finally:
        await redis_client.delete(lock_key)
