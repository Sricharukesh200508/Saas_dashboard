from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db_session
from app.models.integration import Integration
from app.schemas.integration import IntegrationResponse, IntegrationCreate
from app.core.security import decode_token, TokenPayload

router = APIRouter()

@router.get("", response_model=List[IntegrationResponse])
async def list_integrations(
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(select(Integration).where(Integration.tenant_id == token.tenant_id))
    return result.scalars().all()

@router.post("", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_integration(
    data: IntegrationCreate,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    integration = Integration(
        tenant_id=token.tenant_id,
        provider=data.provider,
        credentials=data.credentials,
        is_active=data.is_active
    )
    db.add(integration)
    await db.commit()
    await db.refresh(integration)
    return integration

@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integration(
    integration_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id, Integration.tenant_id == token.tenant_id)
    )
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    await db.delete(integration)
    await db.commit()
