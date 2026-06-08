from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str
    tenant_id: str
    role: str
    scopes: List[str] = []

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class ApiKeyCreate(BaseModel):
    name: str
    scopes: List[str] = []

class ApiKeyResponse(BaseModel):
    id: UUID
    name: str
    key_prefix: str
    key_secret: Optional[str] = None  # Only returned on creation
    scopes: List[str]

# ── Registration ──────────────────────────────────────────────────────────────

class TenantRegisterRequest(BaseModel):
    """Self-serve tenant + owner registration in one step."""
    tenant_name: str
    tenant_slug: str
    domain: Optional[str] = None
    owner_email: EmailStr
    owner_password: str

class UserRegisterRequest(BaseModel):
    """Add a user to an existing tenant (requires owner/admin JWT)."""
    email: EmailStr
    password: str
    role: str = "viewer"

