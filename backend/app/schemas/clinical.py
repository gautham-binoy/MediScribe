from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.ai.schemas.ai_schemas import (
    ClinicalExtractionSchema,
    DiagnosisItemSchema,
    ICDItemSchema,
    InvestigationItemSchema,
    PrescriptionDraftSchema,
    PrescriptionItemSchema,
)


class ClinicalExtractionResponse(ClinicalExtractionSchema):
    id: str
    consultation_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SOAPNoteResponse(BaseModel):
    id: str
    consultation_id: str
    subjective: str
    objective: str
    assessment: str
    plan: str
    is_ai_draft: bool
    disclaimer: str
    doctor_notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SOAPNoteUpdate(BaseModel):
    subjective: str | None = None
    objective: str | None = None
    assessment: str | None = None
    plan: str | None = None
    doctor_notes: str | None = None


class DiagnosisResponse(DiagnosisItemSchema):
    id: str
    consultation_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DiagnosisUpdate(BaseModel):
    condition: str | None = None
    reason: str | None = None
    confidence: str | None = None
    status: str | None = None  # SUGGESTED, ACCEPTED, REJECTED, MODIFIED


class InvestigationResponse(InvestigationItemSchema):
    id: str
    consultation_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvestigationUpdate(BaseModel):
    name: str | None = None
    reason: str | None = None
    status: str | None = None  # RECOMMENDED, ORDERED, OMITTED


class PrescriptionItemResponse(PrescriptionItemSchema):
    id: str
    prescription_id: str

    model_config = ConfigDict(from_attributes=True)


class PrescriptionResponse(BaseModel):
    id: str
    consultation_id: str
    status: str
    disclaimer: str
    general_instructions: str | None = None
    doctor_signature: str | None = None
    items: list[PrescriptionItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PrescriptionUpdate(BaseModel):
    general_instructions: str | None = None
    items: list[PrescriptionItemSchema] | None = None


class ICDResponse(ICDItemSchema):
    id: str
    consultation_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ICDUpdate(BaseModel):
    code: str | None = None
    description: str | None = None
    reason: str | None = None
    status: str | None = None


class ApprovalRequest(BaseModel):
    doctor_notes: str | None = Field(None, description="Doctor's final clinical sign-off notes")


class ApprovalResponse(BaseModel):
    id: str
    consultation_id: str
    doctor_name: str
    doctor_license: str
    doctor_notes: str | None = None
    signature_hash: str
    approved_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RejectionRequest(BaseModel):
    reason: str = Field(..., description="Reason for rejecting the AI draft")


class SaveDraftRequest(BaseModel):
    soap: SOAPNoteUpdate | None = None
    diagnoses: list[DiagnosisItemSchema] | None = None
    investigations: list[InvestigationItemSchema] | None = None
    prescription: PrescriptionDraftSchema | None = None
    icd_codes: list[ICDItemSchema] | None = None
