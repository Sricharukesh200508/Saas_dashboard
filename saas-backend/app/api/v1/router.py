from fastapi import APIRouter
from app.api.v1 import auth, metrics, webhooks, alerts, audit_logs, api_keys, user_webhooks, integrations, team, billing, tenant

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks - Stripe"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Logs"])
api_router.include_router(api_keys.router, prefix="/api-keys", tags=["API Keys"])
api_router.include_router(user_webhooks.router, prefix="/user-webhooks", tags=["User Webhooks"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["Integrations"])
api_router.include_router(team.router, prefix="/team", tags=["Team"])
api_router.include_router(billing.router, prefix="/billing", tags=["Billing"])
api_router.include_router(tenant.router, prefix="/tenant", tags=["Tenant"])
