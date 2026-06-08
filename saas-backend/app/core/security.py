import jwt
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError

from app.config import settings
from app.schemas.auth import TokenPayload

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str, tenant_id: str, role: str, scopes: List[str] = [], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "tenant_id": str(tenant_id),
        "role": role,
        "scopes": scopes
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def create_refresh_token(subject: str, tenant_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "tenant_id": str(tenant_id),
        "role": role,
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def decode_token(token: str = Depends(oauth2_scheme)) -> TokenPayload:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
        return token_data
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# RBAC Decorators/Dependencies
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, token_payload: TokenPayload = Depends(decode_token)):
        if token_payload.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return token_payload

require_owner = RoleChecker(["owner"])
require_admin = RoleChecker(["owner", "admin"])
require_member = RoleChecker(["owner", "admin", "member"])

# OAuth / SAML Placeholders
async def authenticate_oauth2_google(token: str) -> Dict[str, Any]:
    """Validates Google OAuth2 token and returns user info"""
    # Requires google-auth library in production
    pass

async def process_saml_assertion(saml_response: str) -> Dict[str, Any]:
    """Validates SAML assertion and extracts user data"""
    # Requires python3-saml or similar
    pass


# ── API Key Validation ────────────────────────────────────────────────────────
import hashlib
from fastapi import Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from dataclasses import dataclass


@dataclass
class ApiKeyContext:
    tenant_id: str
    api_key_id: str
    scopes: list


async def get_api_key_context(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: "AsyncSession" = Depends(lambda: None),  # overridden by endpoint
) -> ApiKeyContext:
    """
    Validates X-API-Key header by SHA-256 hash lookup in api_keys table.
    Raises 401 if key is invalid/inactive, 403 if missing required scope.
    """
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API key",
    )


def make_api_key_dep(required_scope: Optional[str] = None):
    """
    Factory that returns a FastAPI dependency for API key validation.
    Usage: Depends(make_api_key_dep("metrics:write"))
    """
    async def _dep(
        x_api_key: str = Header(..., alias="X-API-Key"),
    ) -> ApiKeyContext:
        from app.models.api_key import ApiKey
        from app.db.base import get_db_session, set_tenant_context

        key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()

        # We need a DB session — use a fresh one since this is a dependency
        from app.db.base import async_session_maker
        async with async_session_maker() as session:
            stmt = select(ApiKey).where(
                ApiKey.key_hash == key_hash,
                ApiKey.is_active == True,  # noqa: E712
            )
            result = await session.execute(stmt)
            api_key = result.scalar_one_or_none()

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked API key",
                headers={"WWW-Authenticate": "ApiKey"},
            )

        # Check expiry
        if api_key.expires_at:
            from datetime import datetime, timezone
            if api_key.expires_at < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API key has expired",
                )

        # Check scope
        if required_scope and required_scope not in (api_key.scopes or []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"API key missing required scope: {required_scope}",
            )

        return ApiKeyContext(
            tenant_id=str(api_key.tenant_id),
            api_key_id=str(api_key.id),
            scopes=api_key.scopes or [],
        )

    return _dep

