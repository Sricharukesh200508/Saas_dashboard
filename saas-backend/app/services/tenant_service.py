from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate

class TenantService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_tenant_by_id(self, tenant_id: str) -> Tenant:
        result = await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = result.scalar_one_or_none()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        return tenant

    async def create_tenant(self, data: TenantCreate) -> Tenant:
        # Check slug
        existing = await self.db.execute(select(Tenant).where(Tenant.slug == data.slug))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Slug already taken")
            
        tenant = Tenant(**data.model_dump())
        self.db.add(tenant)
        await self.db.commit()
        await self.db.refresh(tenant)
        return tenant
