"""
Auth endpoints: login, logout, tenant registration, user registration.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db_session
from app.schemas.auth import (
    LoginRequest, Token,
    TenantRegisterRequest, UserRegisterRequest,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.services.tenant_service import TenantService
from app.core.security import decode_token, TokenPayload

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """Authenticate with email + password, returns JWT access + refresh tokens."""
    auth_service = AuthService(db)
    return await auth_service.authenticate_user(login_data)


@router.post("/logout")
async def logout():
    """
    Logout endpoint. In production, add the refresh token to a Redis blacklist.
    """
    return {"message": "Successfully logged out"}


@router.post(
    "/register-tenant",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new tenant + owner account",
)
async def register_tenant(
    data: TenantRegisterRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Self-serve onboarding: creates Tenant, owner User, and starter Subscription
    atomically. Returns a JWT so the user is immediately signed in.
    """
    tenant_service = TenantService(db)
    return await tenant_service.register_tenant_with_owner(data)


@router.post(
    "/register-user",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a user to an existing tenant",
)
async def register_user(
    data: UserRegisterRequest,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token),
):
    """
    Add a new user to the caller's tenant.
    Requires a valid JWT. Only owner/admin roles can add users.
    """
    tenant_service = TenantService(db)
    user = await tenant_service.add_user_to_tenant(
        tenant_id=token.tenant_id,
        data=data,
        requesting_user_role=token.role,
    )
    return UserResponse.model_validate(user)
