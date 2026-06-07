from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import strawberry
from strawberry.fastapi import GraphQLRouter

from app.api.v1.router import api_router
from app.api.ws.router import router as ws_router
from app.core.middleware import AdvancedMiddleware
from app.core.telemetry import setup_telemetry
from app.config import settings

# Sample GraphQL Schema (Placeholder)
@strawberry.type
class Query:
    @strawberry.field
    def hello(self) -> str:
        return "GraphQL is ready"

schema = strawberry.Schema(query=Query)
graphql_app = GraphQLRouter(schema)

app = FastAPI(
    title="SaaS Metrics Dashboard API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Configure in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Enterprise Middleware (Rate Limit, Tenants)
app.add_middleware(AdvancedMiddleware)

# Telemetry
if settings.ENVIRONMENT != "test":
    setup_telemetry(app)

# Include Routers
app.include_router(api_router, prefix="/api/v1")

# WebSockets
app.include_router(ws_router, prefix="/ws", tags=["WebSockets"])

# GraphQL Endpoint
app.include_router(graphql_app, prefix="/graphql")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
