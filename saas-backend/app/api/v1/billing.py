from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db_session
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionResponse
from app.core.security import decode_token, TokenPayload

router = APIRouter()

@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(select(Subscription).where(Subscription.tenant_id == token.tenant_id))
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    return subscription

@router.get("/invoices")
async def list_invoices(
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    # In a real application, this would query Stripe API or a local Invoice table.
    # We will return mock invoices for now.
    return [
        {
            "id": "in_1",
            "amount_paid": 2900,
            "status": "paid",
            "created_at": "2024-03-01T10:00:00Z",
            "invoice_pdf": "https://stripe.com/invoice/1"
        },
        {
            "id": "in_2",
            "amount_paid": 2900,
            "status": "paid",
            "created_at": "2024-02-01T10:00:00Z",
            "invoice_pdf": "https://stripe.com/invoice/2"
        }
    ]
