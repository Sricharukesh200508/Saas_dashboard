"""
AuditLogger — write structured audit log entries to the audit_logs table.

Usage:
    await AuditLogger.log(
        db=session,
        tenant_id=str(tenant.id),
        user_id=str(current_user.id),
        action="api_key.created",
        resource_type="api_key",
        resource_id=str(api_key.id),
        before_state=None,
        after_state={"name": api_key.name, "scopes": api_key.scopes},
        request=request,        # optional: captures IP + User-Agent
    )
"""
import logging
from typing import Any, Dict, Optional

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


class AuditLogger:
    @staticmethod
    async def log(
        db: AsyncSession,
        tenant_id: str,
        action: str,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
    ) -> AuditLog:
        """
        Persist an audit log entry.

        - action: dot-notation string, e.g. "subscription.upgraded", "api_key.revoked"
        - before_state / after_state: serializable dicts with relevant fields
        - request: if provided, captures IP address and User-Agent
        """
        ip_address: Optional[str] = None
        user_agent: Optional[str] = None

        if request:
            ip_address = (
                request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                or (request.client.host if request.client else None)
            )
            user_agent = request.headers.get("User-Agent")

        entry = AuditLog(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            before_state=before_state,
            after_state=after_state,
        )

        db.add(entry)
        try:
            await db.flush()  # persist within current transaction
        except Exception as exc:
            # Audit log failure must NOT break the main business operation
            logger.error(
                "Failed to write audit log [%s] tenant=%s: %s",
                action, tenant_id, exc
            )
            await db.rollback()
            return entry

        logger.debug(
            "AUDIT | action=%s tenant=%s user=%s resource=%s/%s",
            action, tenant_id, user_id, resource_type, resource_id
        )
        return entry
