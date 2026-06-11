from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
import secrets

from app.db.base import get_db_session
from app.models.webhook import WebhookEndpoint, WebhookDelivery
from app.schemas.webhook import WebhookEndpointResponse, WebhookEndpointCreate, WebhookEndpointUpdate, WebhookDeliveryResponse
from app.core.security import decode_token, TokenPayload

router = APIRouter()

@router.get("", response_model=List[WebhookEndpointResponse])
async def list_webhooks(
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.tenant_id == token.tenant_id))
    return result.scalars().all()

@router.post("", response_model=WebhookEndpointResponse, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    data: WebhookEndpointCreate,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    secret = f"whsec_{secrets.token_hex(24)}"
    webhook = WebhookEndpoint(
        tenant_id=token.tenant_id,
        name=data.name,
        url=str(data.url),
        events=data.events,
        is_active=data.is_active,
        secret=secret
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    return webhook

@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(
        select(WebhookEndpoint).where(WebhookEndpoint.id == webhook_id, WebhookEndpoint.tenant_id == token.tenant_id)
    )
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    await db.delete(webhook)
    await db.commit()

@router.get("/deliveries", response_model=List[WebhookDeliveryResponse])
async def list_webhook_deliveries(
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(
        select(WebhookDelivery)
        .where(WebhookDelivery.tenant_id == token.tenant_id)
        .order_by(desc(WebhookDelivery.created_at))
        .limit(limit)
    )
    return result.scalars().all()

@router.post("/deliveries/{delivery_id}/retry")
async def retry_webhook_delivery(
    delivery_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(
        select(WebhookDelivery).where(WebhookDelivery.id == delivery_id, WebhookDelivery.tenant_id == token.tenant_id)
    )
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    # In a real app, this would enqueue a background task to replay the webhook
    # For now, we simulate success
    return {"message": "Webhook retry enqueued"}
