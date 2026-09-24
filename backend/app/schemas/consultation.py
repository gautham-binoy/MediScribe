from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.clinical import (
    ApprovalResponse,
    ClinicalExtractionResponse,
    DiagnosisResponse,
    ICDResponse,
    InvestigationResponse,
    PrescriptionResponse,
    SOAPNoteResponse,
)
from app.schemas.patient import PatientResponse


class TranscriptSegment(BaseModel):
    speaker: str  # Doctor, Patient
    text: str
    timestamp: str  # MM:SS

    model_config = ConfigDict(from_attributes=True)


class TranscriptResponse(BaseModel):
    id: str
    consultation_id: str
    original_transcript: str
    normalized_clinical_text: str
    normalized_transcript: str | None = None
    clinical_summary: str | None = None
    detected_language: str
    segments: list[TranscriptSegment] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TranscriptUpdateRequest(BaseModel):
    original_transcript: str
    normalized_clinical_text: str | None = None
    normalized_transcript: str | None = None
    clinical_summary: str | None = None
    detected_language: str | None = "Malayalam + English"
    segments: list[TranscriptSegment] | None = None


class ConsultationCreate(BaseModel):
    patient_id: str = Field(..., description="Target patient unique ID (e.g. P1001 or UUID)")
    conversation_language: str = Field(default="Auto Detect")
    output_language: str = Field(default="English")
    is_demo: bool = Field(default=True)


class ConsultationResponse(BaseModel):
    id: str
    consultation_id: str
    patient_id: str
    doctor_id: str | None = None
    status: str
    conversation_language: str
    output_language: str
    detected_language: str
    duration_seconds: int
    is_demo: bool
    started_at: datetime
    ended_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    patient: PatientResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class ConsultationDetailResponse(ConsultationResponse):
    transcript: TranscriptResponse | None = None
    clinical_extraction: ClinicalExtractionResponse | None = None
    clinical_note: SOAPNoteResponse | None = None
    diagnosis_suggestions: list[DiagnosisResponse] = []
    investigation_suggestions: list[InvestigationResponse] = []
    prescription: PrescriptionResponse | None = None
    icd_suggestions: list[ICDResponse] = []
    approval: ApprovalResponse | None = None
    rag_sources: list[str] = []

    model_config = ConfigDict(from_attributes=True)
