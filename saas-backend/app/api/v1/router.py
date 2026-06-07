from fastapi import APIRouter
from app.api.v1 import auth, metrics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])

# Other routers (tenants, subscriptions, alerts) would be included here
