from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

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
    tenant_id: UUID
    name: str
    partial_key: str
    raw_key: Optional[str] = None
    scopes: List[str]
    created_at: datetime
    last_used_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

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

