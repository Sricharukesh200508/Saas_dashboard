from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from app.models.user import User
from app.models.api_key import ApiKey
from app.schemas.auth import LoginRequest, Token, ApiKeyCreate, ApiKeyResponse
from app.core.security import verify_password, create_access_token, create_refresh_token
import secrets
import hashlib

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_user(self, login_data: LoginRequest) -> Token:
        stmt = select(User).where(User.email == login_data.email)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")

        access_token = create_access_token(
            subject=str(user.id), 
            tenant_id=str(user.tenant_id), 
            role=user.role
        )
        refresh_token = create_refresh_token(
            subject=str(user.id), 
            tenant_id=str(user.tenant_id), 
            role=user.role
        )
        
        return Token(access_token=access_token, refresh_token=refresh_token)

    async def create_api_key(self, tenant_id: str, user_id: str, key_data: ApiKeyCreate) -> ApiKeyResponse:
        raw_key = secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        key_prefix = raw_key[:8]
        
        api_key = ApiKey(
            tenant_id=tenant_id,
            user_id=user_id,
            key_hash=key_hash,
            key_prefix=key_prefix,
            name=key_data.name,
            scopes=key_data.scopes
        )
        self.db.add(api_key)
        await self.db.commit()
        await self.db.refresh(api_key)
        
        return ApiKeyResponse(
            id=api_key.id,
            name=api_key.name,
            key_prefix=key_prefix,
            key_secret=raw_key,
            scopes=api_key.scopes
        )
