import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ClinicalExtraction(Base):
    __tablename__ = "clinical_extractions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    chief_complaint: Mapped[str] = mapped_column(Text, nullable=True)
    symptoms: Mapped[list] = mapped_column(JSON, default=list)
    symptom_duration: Mapped[str] = mapped_column(String(200), nullable=True)
    symptom_severity: Mapped[str] = mapped_column(String(100), nullable=True)
    history_of_present_illness: Mapped[str] = mapped_column(Text, nullable=True)
    past_medical_history: Mapped[str] = mapped_column(Text, nullable=True)
    allergies: Mapped[str] = mapped_column(Text, nullable=True)
    current_medications: Mapped[str] = mapped_column(Text, nullable=True)
    family_history: Mapped[str] = mapped_column(Text, nullable=True)
    social_history: Mapped[str] = mapped_column(Text, nullable=True)
    vitals: Mapped[dict] = mapped_column(JSON, default=dict)
    examination_findings: Mapped[str] = mapped_column(Text, nullable=True)
    investigations_mentioned: Mapped[list] = mapped_column(JSON, default=list)
    medications_mentioned: Mapped[list] = mapped_column(JSON, default=list)
    important_warnings: Mapped[list] = mapped_column(JSON, default=list)
    unanswered_questions: Mapped[list] = mapped_column(JSON, default=list)

    raw_ai_response: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    consultation: Mapped["Consultation"] = relationship(
        "Consultation", back_populates="clinical_extraction"
    )


class ClinicalNote(Base):
    __tablename__ = "clinical_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # SOAP components
    subjective: Mapped[str] = mapped_column(Text, nullable=False)
    objective: Mapped[str] = mapped_column(Text, nullable=False)
    assessment: Mapped[str] = mapped_column(Text, nullable=False)
    plan: Mapped[str] = mapped_column(Text, nullable=False)

    is_ai_draft: Mapped[bool] = mapped_column(Boolean, default=True)
    disclaimer: Mapped[str] = mapped_column(
        String(255),
        default="AI GENERATED - REQUIRES DOCTOR REVIEW. NOT AN AUTONOMOUS CLINICAL RECORD.",
    )
    doctor_notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    consultation: Mapped["Consultation"] = relationship(
        "Consultation", back_populates="clinical_note"
    )


class DiagnosisSuggestion(Base):
    __tablename__ = "diagnosis_suggestions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False
    )

    condition: Mapped[str] = mapped_column(String(255), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[str] = mapped_column(String(50), default="Moderate")  # High, Moderate, Low
    source: Mapped[str] = mapped_column(
        String(255), nullable=True
    )  # RAG guideline / Consultation context
    status: Mapped[str] = mapped_column(
        String(50), default="SUGGESTED"
    )  # SUGGESTED, ACCEPTED, REJECTED, MODIFIED

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    consultation: Mapped["Consultation"] = relationship(
        "Consultation", back_populates="diagnosis_suggestions"
    )


class InvestigationSuggestion(Base):
    __tablename__ = "investigation_suggestions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="RECOMMENDED"
    )  # RECOMMENDED, ORDERED, OMITTED

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    consultation: Mapped["Consultation"] = relationship(
        "Consultation", back_populates="investigation_suggestions"
    )


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True
    )

    status: Mapped[str] = mapped_column(String(50), default="DRAFT")  # DRAFT, APPROVED, REJECTED
    disclaimer: Mapped[str] = mapped_column(
        String(255),
        default="AI-GENERATED PRESCRIPTION DRAFT. REQUIRES DOCTOR REVIEW & APPROVAL. DO NOT DISPENSE AUTOMATICALLY.",
    )
    general_instructions: Mapped[str] = mapped_column(Text, nullable=True)
    doctor_signature: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    consultation: Mapped["Consultation"] = relationship(
        "Consultation", back_populates="prescription"
    )
    items: Mapped[list["PrescriptionItem"]] = relationship(
        "PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan"
    )


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prescription_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False
    )

    medication_name: Mapped[str] = mapped_column(String(200), nullable=False)
    strength: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., 650mg
    dose: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., 1 tablet
    route: Mapped[str] = mapped_column(String(50), default="Oral")  # Oral, IV, IM, Topical
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., Thrice daily (TDS)
    duration: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., 3 days
    instructions: Mapped[str] = mapped_column(Text, nullable=True)  # e.g., Take after food
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)

    prescription: Mapped["Prescription"] = relationship("Prescription", back_populates="items")


class ICDSuggestion(Base):
    __tablename__ = "icd_suggestions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False
    )

    code: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., R50.9
    description: Mapped[str] = mapped_column(
        String(255), nullable=False
    )  # e.g., Fever, unspecified
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="SUGGESTED"
    )  # SUGGESTED, ACCEPTED, REJECTED

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    consultation: Mapped["Consultation"] = relationship(
        "Consultation", back_populates="icd_suggestions"
    )


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True
    )

    doctor_name: Mapped[str] = mapped_column(String(200), nullable=False)
    doctor_license: Mapped[str] = mapped_column(String(100), nullable=False)
    doctor_notes: Mapped[str] = mapped_column(Text, nullable=True)
    signature_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    approved_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    consultation: Mapped["Consultation"] = relationship("Consultation", back_populates="approval")
