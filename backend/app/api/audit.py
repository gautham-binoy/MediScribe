from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit Log"])


@router.get("", response_model=list[AuditLogResponse])
def get_audit_logs(
    action: str | None = Query(None, description="Filter by audit action"),
    target_id: str | None = Query(None, description="Filter by consultation or patient ID"),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if target_id:
        query = query.filter(AuditLog.target_id == target_id)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return [AuditLogResponse.model_validate(log) for log in logs]
