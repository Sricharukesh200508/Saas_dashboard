from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.db.base import get_db_session
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse
from app.core.security import decode_token, TokenPayload

router = APIRouter()

@router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.tenant_id == token.tenant_id)
        .order_by(desc(AuditLog.created_at))
        .limit(limit)
    )
    return result.scalars().all()
