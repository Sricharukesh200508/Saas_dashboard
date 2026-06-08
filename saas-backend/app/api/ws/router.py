"""
WebSocket router — real-time metric streaming.

Architecture:
- Client connects to /ws/live-metrics/{tenant_id}?token=<jwt>
- JWT is validated on handshake; tenant_id in token must match path param
- Server subscribes to Redis pub/sub channel metrics:{tenant_id}
- Kafka consumer publishes to that channel after persisting each event
- Supports multiple server instances (Redis acts as the broadcast bus)
- ConnectionManager tracks active connections per tenant for graceful teardown
"""
import asyncio
import json
import logging
from collections import defaultdict
from typing import Dict, List

import redis.asyncio as redis_async
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status

from app.config import settings
from app.core.security import decode_token

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """Thread-safe WebSocket connection manager, keyed by tenant_id."""

    def __init__(self):
        # tenant_id -> list of active WebSocket connections
        self._connections: Dict[str, List[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, tenant_id: str):
        await websocket.accept()
        self._connections[tenant_id].append(websocket)
        logger.info(
            "WS connected: tenant=%s total=%d",
            tenant_id, len(self._connections[tenant_id])
        )

    def disconnect(self, websocket: WebSocket, tenant_id: str):
        conns = self._connections.get(tenant_id, [])
        if websocket in conns:
            conns.remove(websocket)
        logger.info(
            "WS disconnected: tenant=%s remaining=%d",
            tenant_id, len(conns)
        )

    async def broadcast_to_tenant(self, tenant_id: str, data: str):
        """Send a message to all connections for a given tenant."""
        dead = []
        for ws in self._connections.get(tenant_id, []):
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, tenant_id)


manager = ConnectionManager()


@router.websocket("/live-metrics/{tenant_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    tenant_id: str,
    token: str = Query(..., description="JWT access token for authentication"),
):
    """
    Real-time metric stream for a tenant.
    Authenticate via ?token=<jwt_access_token>
    """
    # ── JWT auth on handshake ──────────────────────────────────────────────
    try:
        payload = decode_token(token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Tenant isolation: JWT tenant must match path
    if payload.tenant_id != tenant_id:
        logger.warning(
            "WS tenant mismatch: jwt_tenant=%s path_tenant=%s",
            payload.tenant_id, tenant_id
        )
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, tenant_id)

    # ── Redis pub/sub subscription ─────────────────────────────────────────
    redis_client = redis_async.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = redis_client.pubsub()
    channel = f"metrics:{tenant_id}"
    await pubsub.subscribe(channel)
    logger.info("WS subscribed to Redis channel: %s", channel)

    async def redis_listener():
        """Background task: forward Redis messages to this WebSocket."""
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    await websocket.send_text(message["data"])
                except WebSocketDisconnect:
                    break
                except Exception as exc:
                    logger.warning("WS send error: %s", exc)
                    break

    listener_task = asyncio.create_task(redis_listener())

    try:
        # Keep connection alive; also handle pings from client
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Send a heartbeat so the connection stays alive through proxies
                await websocket.send_json({"type": "heartbeat"})
    except WebSocketDisconnect:
        logger.info("WS client disconnected: tenant=%s", tenant_id)
    except Exception as exc:
        logger.error("WS unexpected error: %s", exc)
    finally:
        listener_task.cancel()
        try:
            await pubsub.unsubscribe(channel)
            await redis_client.aclose()
        except Exception:
            pass
        manager.disconnect(websocket, tenant_id)
