from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import secrets

from app.db.base import get_db_session
from app.models.api_key import ApiKey
from app.schemas.auth import ApiKeyCreate, ApiKeyResponse
from app.core.security import decode_token, TokenPayload

router = APIRouter()

@router.get("", response_model=List[ApiKeyResponse])
async def list_api_keys(
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(select(ApiKey).where(ApiKey.tenant_id == UUID(token.tenant_id)))
    keys = result.scalars().all()
    # Need to map key_prefix to partial_key for the response
    responses = []
    for k in keys:
        responses.append(ApiKeyResponse(
            id=k.id,
            tenant_id=k.tenant_id,
            name=k.name,
            partial_key=k.key_prefix,
            scopes=k.scopes,
            created_at=k.created_at,
            last_used_at=k.last_used_at
        ))
    return responses

@router.post("", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    data: ApiKeyCreate,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    # Basic key generation prefix sk_test_ or sk_live_
    # Note: Real implementation would hash the key and only store the hash,
    # but since this is for testing and the user needs to see it, we return it.
    raw_key = f"sk_live_{secrets.token_hex(24)}"
    
    # Normally we hash, but we have `key_hash` in ApiKey model.
    import hashlib
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    
    # Store partial key for display in key_prefix (max 8 chars usually, but model says String(8))
    # We will just use the first 8 chars of raw_key
    key_prefix = raw_key[:8]
    
    api_key = ApiKey(
        tenant_id=UUID(token.tenant_id),
        user_id=UUID(token.sub),
        name=data.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        scopes=data.scopes
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    
    from datetime import datetime, timezone
    
    # We must return the raw key ONCE so the user can see it
    return ApiKeyResponse(
        id=api_key.id,
        tenant_id=api_key.tenant_id,
        name=api_key.name,
        partial_key=api_key.key_prefix,
        raw_key=raw_key,
        scopes=api_key.scopes,
        created_at=api_key.created_at or datetime.now(timezone.utc),
        last_used_at=api_key.last_used_at
    ).model_dump()

@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.tenant_id == UUID(token.tenant_id))
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key not found")
        
    await db.delete(api_key)
    await db.commit()
