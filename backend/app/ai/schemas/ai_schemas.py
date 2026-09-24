from typing import Any

from pydantic import BaseModel, Field


class ClinicalExtractionSchema(BaseModel):
    """
    Structured clinical information extracted from the doctor-patient dialogue.
    Strict guideline: Never invent missing information; use null or 'Not documented'.
    """

    chief_complaint: str | None = Field(
        None,
        description="Primary reason for visit in concise clinical terms (e.g. 'Fever for 3 days')",
    )
    symptoms: list[str] = Field(
        default_factory=list, description="Explicit list of reported patient symptoms"
    )
    symptom_duration: str | None = Field(
        None, description="Reported duration of symptoms, e.g. '3 days'"
    )
    symptom_severity: str | None = Field(
        None,
        description="Severity reported by patient or estimated clinically (Mild / Moderate / Severe / Not documented)",
    )
    history_of_present_illness: str | None = Field(
        None, description="Chronological narrative of the current illness"
    )
    past_medical_history: str | None = Field(
        None, description="Known medical conditions or 'Not documented' if not mentioned"
    )
    allergies: str | None = Field(
        None, description="Reported drug/food allergies or 'No known drug allergies reported'"
    )
    current_medications: str | None = Field(
        None, description="Medications the patient is currently taking or 'Not documented'"
    )
    family_history: str | None = Field(
        None, description="Relevant family medical history or 'Not documented'"
    )
    social_history: str | None = Field(
        None, description="Habits, occupation, lifestyle or 'Not documented'"
    )
    vitals: dict[str, Any] = Field(
        default_factory=dict,
        description="Extracted vitals if mentioned (BP, Pulse, Temperature, SpO2) or empty",
    )
    examination_findings: str | None = Field(
        None,
        description="Physical examination observations mentioned by doctor or 'Not documented'",
    )
    investigations_mentioned: list[str] = Field(
        default_factory=list,
        description="Lab tests or imaging explicitly discussed during consultation",
    )
    medications_mentioned: list[str] = Field(
        default_factory=list,
        description="Medications discussed, prior therapies, or patient inquiries",
    )
    important_warnings: list[str] = Field(
        default_factory=list, description="Clinical red flags, allergy risks, or safety precautions"
    )
    unanswered_questions: list[str] = Field(
        default_factory=list,
        description="Information missing from the conversation that the doctor should verify",
    )


class SOAPNoteSchema(BaseModel):
    """
    Standardized SOAP Clinical Progress Note.
    Subject to mandatory doctor review and explicit approval.
    """

    subjective: str = Field(
        ..., description="Patient's reported history, symptoms, onset, and chronological experience"
    )
    objective: str = Field(
        ..., description="Measurable clinical findings, vital signs, physical exam observations"
    )
    assessment: str = Field(
        ...,
        description="Clinical evaluation, differential diagnosis formulation, and illness status",
    )
    plan: str = Field(
        ...,
        description="Management plan, investigations, therapy, patient advice, and follow-up criteria",
    )
    disclaimer: str = Field(
        default="AI GENERATED - REQUIRES DOCTOR REVIEW. NOT AN AUTONOMOUS MEDICAL RECORD."
    )


class DiagnosisItemSchema(BaseModel):
    condition: str = Field(..., description="Suspected clinical diagnosis name")
    reason: str = Field(..., description="Clinical reasoning based on symptoms and findings")
    confidence: str = Field(default="Moderate", description="High / Moderate / Low")
    source: str | None = Field(None, description="Guideline reference or clinical dialogue source")
    status: str = Field(
        default="SUGGESTED", description="SUGGESTED / ACCEPTED / REJECTED / MODIFIED"
    )


class DiagnosisListSchema(BaseModel):
    suggestions: list[DiagnosisItemSchema] = Field(default_factory=list)


class InvestigationItemSchema(BaseModel):
    name: str = Field(..., description="Laboratory test or imaging study name")
    reason: str = Field(..., description="Diagnostic justification")
    source: str | None = Field(None, description="Clinical guideline reference")
    status: str = Field(default="RECOMMENDED", description="RECOMMENDED / ORDERED / OMITTED")


class InvestigationListSchema(BaseModel):
    suggestions: list[InvestigationItemSchema] = Field(default_factory=list)


class PrescriptionItemSchema(BaseModel):
    medication_name: str = Field(..., description="Standard generic or branded formulation name")
    strength: str = Field(..., description="e.g. 650mg, 500mg, 10mg")
    dose: str = Field(..., description="e.g. 1 tablet, 5ml, 1 puff")
    route: str = Field(default="Oral", description="Oral, Inhalation, Topical, IV")
    frequency: str = Field(
        ..., description="e.g. Once daily (OD), Twice daily (BD), Thrice daily (TDS), SOS"
    )
    duration: str = Field(..., description="e.g. 3 days, 5 days, 1 week")
    instructions: str | None = Field(None, description="e.g. After food, with plenty of water")
    is_approved: bool = Field(default=False)


class PrescriptionDraftSchema(BaseModel):
    disclaimer: str = Field(
        default="AI-GENERATED PRESCRIPTION DRAFT. REQUIRES DOCTOR REVIEW & APPROVAL. DO NOT DISPENSE AUTOMATICALLY."
    )
    general_instructions: str | None = Field(
        None, description="General patient advice, hydration, rest"
    )
    items: list[PrescriptionItemSchema] = Field(default_factory=list)


class ICDItemSchema(BaseModel):
    code: str = Field(..., description="ICD-10 clinical classification code (e.g. R50.9, J06.9)")
    description: str = Field(..., description="Official ICD-10 description")
    reason: str = Field(..., description="Why this code corresponds to the diagnosis")
    status: str = Field(default="SUGGESTED", description="SUGGESTED / ACCEPTED / REJECTED")


class ICDListSchema(BaseModel):
    suggestions: list[ICDItemSchema] = Field(default_factory=list)


class MultilingualNormalizationSchema(BaseModel):
    detected_language: str = Field(
        ...,
        description="Detected conversation language: English, Malayalam, or Malayalam + English",
    )
    normalized_clinical_text: str = Field(
        ..., description="Normalized English clinical transcript preserving all medical facts"
    )
    key_findings_summary: str = Field(
        ..., description="Brief 1-2 sentence executive clinical summary"
    )


class MedicationGuideItem(BaseModel):
    medication: str = Field(..., description="Medication name and strength")
    timing_en: str = Field(..., description="When to take in English, e.g. After breakfast")
    timing_ml: str = Field(..., description="When to take in Malayalam, e.g. രാവിലെ ഭക്ഷണത്തിന് ശേഷം")
    purpose_en: str = Field(..., description="Why to take in English, e.g. For pain and fever")
    purpose_ml: str = Field(..., description="Why to take in Malayalam, e.g. പനിക്കും വേദനയ്ക്കും")
    special_notes: str | None = Field(None, description="Precautions or food instructions")


class PatientCareGuideSchema(BaseModel):
    """
    Bilingual Patient After-Care and Discharge Guide (English + Malayalam).
    Provides patient-friendly explanations, medication schedules, dietary advice,
    and emergency red-flag warning signs.
    """
    title_en: str = Field(default="Patient Care & Recovery Guide")
    title_ml: str = Field(default="രോഗി പരിചരണ നിർദ്ദേശങ്ങൾ")
    diagnosis_summary_en: str = Field(..., description="Simple, reassuring explanation of diagnosis in English")
    diagnosis_summary_ml: str = Field(..., description="Simple explanation of diagnosis in Malayalam")
    medication_schedule: list[MedicationGuideItem] = Field(default_factory=list)
    diet_and_lifestyle_en: list[str] = Field(default_factory=list, description="Dietary and lifestyle tips in English")
    diet_and_lifestyle_ml: list[str] = Field(default_factory=list, description="Dietary and lifestyle tips in Malayalam")
    warning_signs_en: list[str] = Field(default_factory=list, description="Red flag danger signs in English")
    warning_signs_ml: list[str] = Field(default_factory=list, description="Red flag danger signs in Malayalam")
    follow_up_en: str = Field(..., description="Follow-up instructions in English")
    follow_up_ml: str = Field(..., description="Follow-up instructions in Malayalam")

