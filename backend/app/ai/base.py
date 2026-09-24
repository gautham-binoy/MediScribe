from abc import ABC, abstractmethod
from typing import Any, TypeVar

from pydantic import BaseModel

from app.ai.schemas.ai_schemas import (
    ClinicalExtractionSchema,
    DiagnosisListSchema,
    ICDListSchema,
    InvestigationListSchema,
    MultilingualNormalizationSchema,
    PatientCareGuideSchema,
    PrescriptionDraftSchema,
    SOAPNoteSchema,
)

T = TypeVar("T", bound=BaseModel)


class AIProvider(ABC):
    """
    Abstract AI Provider Interface for MediScribe AI.
    All LLM backends (Gemini, Mock, OpenAI, Anthropic) must implement this contract.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (gemini, mock, openai, anthropic)."""

    @abstractmethod
    async def generate_text(self, prompt: str, system_instruction: str | None = None) -> str:
        """Generate unstructured text from a prompt."""

    @abstractmethod
    async def generate_structured(
        self, prompt: str, schema_class: type[T], system_instruction: str | None = None
    ) -> T:
        """Generate structured JSON and parse into a Pydantic schema model."""

    @abstractmethod
    async def normalize_multilingual_transcript(
        self, original_transcript: str
    ) -> MultilingualNormalizationSchema:
        """Normalize Malayalam / English / Mixed code-switching dialogue into clinical English."""

    @abstractmethod
    async def analyze_clinical_transcript(
        self, transcript: str, patient_context: dict[str, Any]
    ) -> ClinicalExtractionSchema:
        """Extract structured clinical information from transcript and patient history."""

    @abstractmethod
    async def generate_soap(
        self, extraction: ClinicalExtractionSchema, patient_context: dict[str, Any]
    ) -> SOAPNoteSchema:
        """Synthesize a complete SOAP clinical progress note draft."""

    @abstractmethod
    async def suggest_diagnoses(
        self, extraction: ClinicalExtractionSchema, rag_context: str
    ) -> DiagnosisListSchema:
        """Generate differential diagnosis suggestions backed by clinical guidelines."""

    @abstractmethod
    async def suggest_investigations(
        self, extraction: ClinicalExtractionSchema, diagnoses: list[str], rag_context: str
    ) -> InvestigationListSchema:
        """Propose indicated lab tests or imaging studies."""

    @abstractmethod
    async def generate_prescription_draft(
        self, extraction: ClinicalExtractionSchema, diagnoses: list[str], patient_allergies: str
    ) -> PrescriptionDraftSchema:
        """Draft a medication proposal taking patient allergies into strict account."""

    @abstractmethod
    async def suggest_icd_codes(
        self, diagnoses: list[str], extraction: ClinicalExtractionSchema, rag_context: str
    ) -> ICDListSchema:
        """Suggest relevant ICD-10 diagnostic classifications."""

    @abstractmethod
    async def generate_patient_guide(
        self,
        patient_context: dict[str, Any],
        diagnoses: list[str],
        medications: list[dict[str, Any]],
        doctor_notes: str | None = None,
    ) -> PatientCareGuideSchema:
        """Synthesize a bilingual patient after-care and recovery guide (Malayalam + English)."""

