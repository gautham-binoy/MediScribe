from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    action: str
    actor_id: str | None = None
    actor_name: str | None = None
    actor_role: str | None = None
    target_entity: str | None = None
    target_id: str | None = None
    details: str | None = None
    extra_data: dict[str, Any] | None = None
    ip_address: str | None = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
