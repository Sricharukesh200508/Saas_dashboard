from fastapi import APIRouter
from app.api.v1 import auth, metrics, webhooks

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
