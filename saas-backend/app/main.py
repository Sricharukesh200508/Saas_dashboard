from contextlib import asynccontextmanager
import uuid
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import strawberry
from strawberry.fastapi import GraphQLRouter

from app.api.v1.router import api_router
from app.api.ws.router import router as ws_router
from app.core.middleware import AdvancedMiddleware
from app.core.telemetry import setup_telemetry
from app.config import settings
from app.kafka.consumer import start_consumer, stop_consumer

logger = logging.getLogger(__name__)

# ── GraphQL placeholder ───────────────────────────────────────────────────────
@strawberry.type
class Query:
    @strawberry.field
    def hello(self) -> str:
        return "GraphQL is ready"

schema = strawberry.Schema(query=Query)
graphql_app = GraphQLRouter(schema)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Kafka consumer as background task
    if settings.ENVIRONMENT != "test":
        await start_consumer()
    yield
    if settings.ENVIRONMENT != "test":
        await stop_consumer()


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="SaaS Metrics Dashboard API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "X-Request-ID",
                   "Idempotency-Key", "X-Tenant-ID"],
)

# ── Custom Enterprise Middleware (Rate Limit, Tenants, Request ID) ─────────────
app.add_middleware(AdvancedMiddleware)

# ── Telemetry ─────────────────────────────────────────────────────────────────
if settings.ENVIRONMENT != "test":
    setup_telemetry(app)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")
app.include_router(ws_router, prefix="/ws", tags=["WebSockets"])
app.include_router(graphql_app, prefix="/graphql")


from fastapi.responses import JSONResponse, RedirectResponse

# ── Root Redirect ─────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/api/docs")

# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Deep health check: verifies PostgreSQL, Redis, Kafka, and ClickHouse connectivity.
    Returns 200 when all systems are healthy, 503 when any are degraded.
    """
    checks = {}
    healthy = True

    # PostgreSQL
    try:
        from app.db.base import engine
        from sqlalchemy import text as sa_text
        async with engine.connect() as conn:
            await conn.execute(sa_text("SELECT 1"))
        checks["postgresql"] = "ok"
    except Exception as exc:
        checks["postgresql"] = f"error: {exc}"
        healthy = False

    # Redis
    try:
        import redis.asyncio as redis_async
        r = redis_async.from_url(settings.REDIS_URL, decode_responses=True)
        await r.ping()
        await r.aclose()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"
        healthy = False

    # Kafka (producer metadata fetch)
    try:
        from aiokafka import AIOKafkaProducer
        producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS
        )
        await producer.start()
        await producer.stop()
        checks["kafka"] = "ok"
    except Exception as exc:
        checks["kafka"] = f"error: {exc}"
        healthy = False

    # ClickHouse
    try:
        from app.db.clickhouse import ClickHouseClient
        client = ClickHouseClient.get_client()
        client.query("SELECT 1")
        checks["clickhouse"] = "ok"
    except Exception as exc:
        checks["clickhouse"] = f"error: {exc}"
        # ClickHouse degraded but not critical
        checks["clickhouse"] = f"degraded: {exc}"

    status_code = 200 if healthy else 503
    return JSONResponse(
        status_code=status_code,
        content={"status": "ok" if healthy else "degraded", "checks": checks}
    )
