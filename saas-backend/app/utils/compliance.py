import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class ComplianceAuditLogger:
    """
    Dedicated logger for GDPR / HIPAA events.
    In an enterprise system, this often pipes to a separate WORM (Write Once Read Many) storage or SIEM.
    """
    
    @staticmethod
    def log_pii_access(user_id: str, accessed_user_id: str, fields: list[str]):
        """HIPAA/GDPR requirement: Log when sensitive PII is accessed."""
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "PII_ACCESS",
            "actor_id": user_id,
            "target_user_id": accessed_user_id,
            "fields_accessed": fields
        }
        # Output to stdout to be captured by Fluentd/ELK
        print(f"COMPLIANCE_AUDIT: {json.dumps(event)}")

    @staticmethod
    def log_data_export(user_id: str, tenant_id: str):
        """GDPR requirement: Data Portability event."""
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "DATA_EXPORT",
            "actor_id": user_id,
            "tenant_id": tenant_id
        }
        print(f"COMPLIANCE_AUDIT: {json.dumps(event)}")

    @staticmethod
    def log_right_to_be_forgotten(user_id: str):
        """GDPR requirement: Deletion request."""
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "ACCOUNT_DELETION_REQUEST",
            "target_user_id": user_id
        }
        print(f"COMPLIANCE_AUDIT: {json.dumps(event)}")

compliance_logger = ComplianceAuditLogger()
