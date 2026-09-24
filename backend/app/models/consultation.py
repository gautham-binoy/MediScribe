import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Consultation(Base):
    __tablename__ = "consultations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )  # e.g., CON-2026-0001
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True
    )

    # Status: RECORDING, PROCESSING, AI_DRAFT, PENDING_REVIEW, APPROVED, REJECTED
    status: Mapped[str] = mapped_column(String(50), default="RECORDING", index=True, nullable=False)

    conversation_language: Mapped[str] = mapped_column(
        String(50), default="Auto Detect"
    )  # Auto Detect, English, Malayalam, Malayalam + English
    output_language: Mapped[str] = mapped_column(String(50), default="English")
    detected_language: Mapped[str] = mapped_column(String(50), default="English")

    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    audio_file_url: Mapped[str] = mapped_column(String(255), nullable=True)
    is_demo: Mapped[bool] = mapped_column(default=True)

    started_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    ended_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    patient: Mapped["Patient"] = relationship("Patient", back_populates="consultations")
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="consultations")

    transcript: Mapped["Transcript"] = relationship(
        "Transcript", back_populates="consultation", uselist=False, cascade="all, delete-orphan"
    )
    clinical_extraction: Mapped["ClinicalExtraction"] = relationship(
        "ClinicalExtraction",
        back_populates="consultation",
        uselist=False,
        cascade="all, delete-orphan",
    )
    clinical_note: Mapped["ClinicalNote"] = relationship(
        "ClinicalNote", back_populates="consultation", uselist=False, cascade="all, delete-orphan"
    )
    diagnosis_suggestions: Mapped[list["DiagnosisSuggestion"]] = relationship(
        "DiagnosisSuggestion", back_populates="consultation", cascade="all, delete-orphan"
    )
    investigation_suggestions: Mapped[list["InvestigationSuggestion"]] = relationship(
        "InvestigationSuggestion", back_populates="consultation", cascade="all, delete-orphan"
    )
    prescription: Mapped["Prescription"] = relationship(
        "Prescription", back_populates="consultation", uselist=False, cascade="all, delete-orphan"
    )
    icd_suggestions: Mapped[list["ICDSuggestion"]] = relationship(
        "ICDSuggestion", back_populates="consultation", cascade="all, delete-orphan"
    )
    approval: Mapped["Approval"] = relationship(
        "Approval", back_populates="consultation", uselist=False, cascade="all, delete-orphan"
    )
