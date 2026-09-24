from typing import Any

from sqlalchemy.orm import Session

from app.core.logging import logger
from app.models.audit import AuditLog


class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        actor_id: str | None = None,
        actor_name: str | None = None,
        actor_role: str | None = None,
        target_entity: str | None = None,
        target_id: str | None = None,
        details: str | None = None,
        extra_data: dict[str, Any] | None = None,
        ip_address: str | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            action=action,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_role=actor_role,
            target_entity=target_entity,
            target_id=target_id,
            details=details,
            extra_data=extra_data or {},
            ip_address=ip_address,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        logger.info(
            f"AUDIT LOG: [{action}] by {actor_name or 'System'} on {target_entity or 'General'} (ID: {target_id})"
        )
        return entry
