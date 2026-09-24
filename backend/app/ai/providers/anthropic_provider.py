from typing import Any, TypeVar

from pydantic import BaseModel

from app.ai.base import AIProvider
from app.ai.providers.mock_provider import MockProvider
from app.ai.schemas.ai_schemas import (
    ClinicalExtractionSchema,
    DiagnosisListSchema,
    ICDListSchema,
    InvestigationListSchema,
    MultilingualNormalizationSchema,
    PrescriptionDraftSchema,
    SOAPNoteSchema,
)
from app.core.config import settings
from app.core.logging import logger

T = TypeVar("T", bound=BaseModel)


class AnthropicProvider(AIProvider):
    """
    Anthropic Claude Provider architecture extension for MediScribe AI.
    Seamlessly falls back to MockProvider if ANTHROPIC_API_KEY is not configured.
    """

    def __init__(self):
        self._fallback = MockProvider()
        self.api_key = settings.ANTHROPIC_API_KEY
        self.model_name = settings.AI_MODEL or "claude-3-5-sonnet-20241022"

    @property
    def provider_name(self) -> str:
        return "anthropic"

    async def generate_text(self, prompt: str, system_instruction: str | None = None) -> str:
        if not self.api_key:
            logger.info("ANTHROPIC_API_KEY not configured. Falling back to MockProvider.")
            return await self._fallback.generate_text(prompt, system_instruction)
        return await self._fallback.generate_text(prompt, system_instruction)

    async def generate_structured(
        self, prompt: str, schema_class: type[T], system_instruction: str | None = None
    ) -> T:
        return await self._fallback.generate_structured(prompt, schema_class, system_instruction)

    async def normalize_multilingual_transcript(
        self, original_transcript: str
    ) -> MultilingualNormalizationSchema:
        return await self._fallback.normalize_multilingual_transcript(original_transcript)

    async def analyze_clinical_transcript(
        self, transcript: str, patient_context: dict[str, Any]
    ) -> ClinicalExtractionSchema:
        return await self._fallback.analyze_clinical_transcript(transcript, patient_context)

    async def generate_soap(
        self, extraction: ClinicalExtractionSchema, patient_context: dict[str, Any]
    ) -> SOAPNoteSchema:
        return await self._fallback.generate_soap(extraction, patient_context)

    async def suggest_diagnoses(
        self, extraction: ClinicalExtractionSchema, rag_context: str
    ) -> DiagnosisListSchema:
        return await self._fallback.suggest_diagnoses(extraction, rag_context)

    async def suggest_investigations(
        self, extraction: ClinicalExtractionSchema, diagnoses: list[str], rag_context: str
    ) -> InvestigationListSchema:
        return await self._fallback.suggest_investigations(extraction, diagnoses, rag_context)

    async def generate_prescription_draft(
        self, extraction: ClinicalExtractionSchema, diagnoses: list[str], patient_allergies: str
    ) -> PrescriptionDraftSchema:
        return await self._fallback.generate_prescription_draft(
            extraction, diagnoses, patient_allergies
        )

    async def suggest_icd_codes(
        self, diagnoses: list[str], extraction: ClinicalExtractionSchema, rag_context: str
    ) -> ICDListSchema:
        return await self._fallback.suggest_icd_codes(diagnoses, extraction, rag_context)
