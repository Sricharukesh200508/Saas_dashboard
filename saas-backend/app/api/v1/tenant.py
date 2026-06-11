from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db_session
from app.models.tenant import Tenant
from app.schemas.tenant import TenantResponse, TenantUpdate
from app.core.security import decode_token, TokenPayload

router = APIRouter()

@router.get("/settings", response_model=TenantResponse)
async def get_tenant_settings(
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(select(Tenant).where(Tenant.id == token.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.patch("/settings", response_model=TenantResponse)
async def update_tenant_settings(
    tenant_update: TenantUpdate,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    if token.role not in ['owner', 'admin']:
        raise HTTPException(status_code=403, detail="Not enough permissions to update settings")

    result = await db.execute(select(Tenant).where(Tenant.id == token.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    update_data = tenant_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)

    await db.commit()
    await db.refresh(tenant)
    return tenant
