import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    # Examples: DOCTOR_LOGIN, CONSULTATION_STARTED, RECORDING_STARTED, TRANSCRIPT_GENERATED,
    #           AI_DRAFT_GENERATED, DOCTOR_EDITED_RECORD, DOCTOR_APPROVED, HOSPITAL_RECORD_CREATED

    actor_id: Mapped[str] = mapped_column(String(50), nullable=True)
    actor_name: Mapped[str] = mapped_column(String(200), nullable=True)
    actor_role: Mapped[str] = mapped_column(String(50), nullable=True)

    target_entity: Mapped[str] = mapped_column(
        String(100), nullable=True
    )  # Consultation, Patient, Prescription
    target_id: Mapped[str] = mapped_column(String(100), nullable=True)

    details: Mapped[str] = mapped_column(Text, nullable=True)
    extra_data: Mapped[dict] = mapped_column(JSON, default=dict)
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), index=True
    )
