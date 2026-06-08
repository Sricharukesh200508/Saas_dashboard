"""
Redis-backed caching decorators and helpers.

Usage:
    @cache(ttl=300, key_prefix="analytics:overview")
    async def get_overview(self, tenant_id: str):
        ...

    # Manual invalidation
    await cache_invalidate("analytics:overview:*")
"""
import asyncio
import functools
import json
import logging
from typing import Any, Callable, Optional

import redis.asyncio as redis_async

from app.config import settings

logger = logging.getLogger(__name__)

# Module-level connection pool (shared across decorators)
_redis: Optional[redis_async.Redis] = None


def _get_redis() -> redis_async.Redis:
    global _redis
    if _redis is None:
        _redis = redis_async.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=20,
        )
    return _redis


def _default_key(*args, key_prefix: str, **kwargs) -> str:
    """
    Build a cache key from prefix + serialised positional args.
    Works for both plain functions and methods (skips 'self').
    """
    parts = [key_prefix]
    for arg in args:
        if hasattr(arg, "__class__") and arg.__class__.__name__ in (
            "AsyncSession", "Session"
        ):
            continue  # skip DB sessions
        parts.append(str(arg))
    for k, v in sorted(kwargs.items()):
        parts.append(f"{k}={v}")
    return ":".join(parts)


def cache(ttl: int = 300, key_prefix: str = "cache", key_fn: Optional[Callable] = None):
    """
    Async cache decorator. Caches function return value in Redis for `ttl` seconds.

    Args:
        ttl: Cache TTL in seconds (default 5 minutes)
        key_prefix: Redis key prefix (use dot-notation, e.g. "analytics.overview")
        key_fn: Optional callable(args, kwargs) -> str for custom key generation
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            r = _get_redis()

            # Build cache key
            if key_fn:
                cache_key = key_fn(*args, **kwargs)
            else:
                cache_key = _default_key(*args, key_prefix=key_prefix, **kwargs)

            # Try to get from cache
            try:
                cached = await r.get(cache_key)
                if cached is not None:
                    logger.debug("Cache HIT: %s", cache_key)
                    return json.loads(cached)
            except Exception as exc:
                logger.warning("Cache GET failed (non-fatal): %s", exc)

            # Cache miss — call the real function
            logger.debug("Cache MISS: %s", cache_key)
            result = await func(*args, **kwargs)

            # Store result
            try:
                await r.set(cache_key, json.dumps(result, default=str), ex=ttl)
            except Exception as exc:
                logger.warning("Cache SET failed (non-fatal): %s", exc)

            return result
        return wrapper
    return decorator


async def cache_invalidate(pattern: str) -> int:
    """
    Delete all Redis keys matching the given glob pattern.
    Returns the number of keys deleted.

    Example:
        await cache_invalidate("analytics.overview:tenant-123:*")
    """
    r = _get_redis()
    try:
        keys = await r.keys(pattern)
        if keys:
            deleted = await r.delete(*keys)
            logger.info("Cache invalidated %d keys matching '%s'", deleted, pattern)
            return deleted
        return 0
    except Exception as exc:
        logger.warning("Cache invalidation failed: %s", exc)
        return 0


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    """Manually set a cache entry."""
    r = _get_redis()
    await r.set(key, json.dumps(value, default=str), ex=ttl)


async def cache_get(key: str) -> Optional[Any]:
    """Manually get a cache entry."""
    r = _get_redis()
    val = await r.get(key)
    return json.loads(val) if val else None
