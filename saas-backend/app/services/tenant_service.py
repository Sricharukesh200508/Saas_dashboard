"""
TenantService — tenant and user lifecycle management.

Handles:
- Atomic tenant + owner user + starter subscription creation
- Adding users to existing tenants
- Tenant lookups
"""
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException

from app.models.tenant import Tenant
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.auth import TenantRegisterRequest, UserRegisterRequest
from app.schemas.tenant import TenantCreate
from app.core.security import get_password_hash, create_access_token, create_refresh_token
from app.schemas.auth import Token

logger = logging.getLogger(__name__)

# Default limits by plan
PLAN_LIMITS = {
    "starter":    {"api_call_limit": 10_000,    "storage_limit_gb": 5},
    "pro":        {"api_call_limit": 500_000,   "storage_limit_gb": 50},
    "enterprise": {"api_call_limit": 10_000_000, "storage_limit_gb": 500},
}


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
        """Create a bare tenant (used internally)."""
        existing = await self.db.execute(
            select(Tenant).where(Tenant.slug == data.slug)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Slug already taken")

        tenant = Tenant(**data.model_dump())
        self.db.add(tenant)
        await self.db.commit()
        await self.db.refresh(tenant)
        return tenant

    async def register_tenant_with_owner(
        self, data: TenantRegisterRequest
    ) -> Token:
        """
        Atomic registration flow:
        1. Create Tenant
        2. Create owner User
        3. Create starter Subscription (trialing, 14-day trial)
        Returns a JWT Token so the user is immediately logged in.
        """
        # Check slug uniqueness
        existing = await self.db.execute(
            select(Tenant).where(Tenant.slug == data.tenant_slug)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Tenant slug already taken")

        # Check email uniqueness across the new tenant (global for owners)
        # (No cross-tenant email uniqueness required — only per-tenant)

        try:
            # 1. Tenant
            tenant = Tenant(
                name=data.tenant_name,
                slug=data.tenant_slug,
                domain=data.domain,
                plan="starter",
                is_active=True,
            )
            self.db.add(tenant)
            await self.db.flush()  # get tenant.id without committing

            # 2. Owner user
            owner = User(
                tenant_id=tenant.id,
                email=data.owner_email,
                hashed_password=get_password_hash(data.owner_password),
                role="owner",
                is_active=True,
            )
            self.db.add(owner)
            await self.db.flush()

            # 3. Starter subscription with 14-day trial
            limits = PLAN_LIMITS["starter"]
            now = datetime.now(timezone.utc)
            subscription = Subscription(
                tenant_id=tenant.id,
                plan="starter",
                status="trialing",
                current_period_start=now,
                current_period_end=now + timedelta(days=14),
                api_call_limit=limits["api_call_limit"],
                storage_limit_gb=limits["storage_limit_gb"],
            )
            self.db.add(subscription)

            await self.db.commit()
            await self.db.refresh(tenant)
            await self.db.refresh(owner)

        except Exception as exc:
            await self.db.rollback()
            logger.error("Tenant registration failed: %s", exc)
            raise HTTPException(status_code=500, detail="Registration failed")

        # Issue JWT immediately so user is logged in
        access_token = create_access_token(
            subject=str(owner.id),
            tenant_id=str(tenant.id),
            role=owner.role,
        )
        refresh_token = create_refresh_token(
            subject=str(owner.id),
            tenant_id=str(tenant.id),
            role=owner.role,
        )
        logger.info(
            "Tenant registered: slug=%s owner=%s", tenant.slug, owner.email
        )
        return Token(access_token=access_token, refresh_token=refresh_token)

    async def add_user_to_tenant(
        self,
        tenant_id: str,
        data: UserRegisterRequest,
        requesting_user_role: str,
    ) -> User:
        """
        Add a new user to an existing tenant.
        Only owner/admin can add users. Owners cannot be added this way.
        """
        if data.role == "owner":
            raise HTTPException(
                status_code=400, detail="Cannot create additional owner accounts"
            )
        if requesting_user_role not in ("owner", "admin"):
            raise HTTPException(
                status_code=403, detail="Only owner or admin can add users"
            )

        # Check email uniqueness within tenant
        existing = await self.db.execute(
            select(User).where(
                User.tenant_id == tenant_id,
                User.email == data.email,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists in tenant"
            )

        user = User(
            tenant_id=tenant_id,
            email=data.email,
            hashed_password=get_password_hash(data.password),
            role=data.role,
            is_active=True,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        logger.info(
            "User added to tenant: tenant=%s email=%s role=%s",
            tenant_id, data.email, data.role
        )
        return user
