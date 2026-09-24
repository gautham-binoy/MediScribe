import asyncio
import json
from pathlib import Path
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
PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


def _read_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""


class GeminiProvider(AIProvider):
    """
    Production Gemini AI Provider utilizing the Google GenAI SDK.
    Includes automated graceful fallback to MockProvider when Gemini key is missing,
    invalid, timed out, or quota exhausted.
    """

    def __init__(self):
        self._fallback_provider = MockProvider()
        from app.core.gemini_keys import get_gemini_key_manager

        self._key_manager = get_gemini_key_manager()
        self.model_name = settings.AI_MODEL or "gemini-3.5-flash-lite"

    @property
    def has_keys(self) -> bool:
        return self._key_manager.has_keys and not settings.DEMO_MODE

    @property
    def _client(self):
        if self.has_keys:
            try:
                client, _ = self._key_manager.get_client()
                return client
            except Exception:
                return None
        return None

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def _call_gemini_generate(self, contents: Any, config: Any) -> str:
        """Call Gemini API with multi-key pool, timeout, rate limit & model cascade resilience."""
        if not self.has_keys:
            raise RuntimeError("Gemini client is not initialized or API keys are missing.")

        models_to_try = [self.model_name]
        for m in [
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-3.6-flash",
            "gemini-3.1-flash-lite",
            "gemini-3.8-flash",
        ]:
            if m not in models_to_try:
                models_to_try.append(m)

        last_error = None
        for client, api_key in self._key_manager.get_cascade():
            masked = api_key[:6] + "..." + api_key[-4:] if len(api_key) > 10 else "key"
            key_rate_limited = False

            for model_to_use in models_to_try:
                for attempt in range(2):
                    try:
                        def _sync_call():
                            return client.models.generate_content(
                                model=model_to_use,
                                contents=contents,
                                config=config,
                            )

                        response = await asyncio.wait_for(asyncio.to_thread(_sync_call), timeout=20.0)
                        self._key_manager.report_success(api_key)
                        return response.text or ""
                    except TimeoutError:
                        logger.warning(
                            f"Model '{model_to_use}' timed out on key [{masked}] after 20s (attempt {attempt + 1})."
                        )
                        last_error = TimeoutError(f"Model '{model_to_use}' timed out.")
                    except Exception as e:
                        err_str = str(e).lower()
                        last_error = e
                        if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                            logger.warning(
                                f"Key [{masked}] reached rate limit / quota on model '{model_to_use}'. Switching to next key in pool..."
                            )
                            self._key_manager.report_rate_limit(api_key, cooldown_seconds=60.0)
                            key_rate_limited = True
                            break
                        is_transient = (
                            "503" in err_str or "unavailable" in err_str or "demand" in err_str
                        )
                        if is_transient and attempt == 0:
                            logger.warning(
                                f"Model '{model_to_use}' on key [{masked}] returned 503 high demand. Retrying..."
                            )
                            await asyncio.sleep(1.0)
                            continue
                        else:
                            logger.warning(
                                f"Model '{model_to_use}' on key [{masked}] failed ({err_str[:100]}). Trying next candidate..."
                            )
                            break

                if key_rate_limited:
                    break

            if key_rate_limited:
                continue

        if last_error:
            logger.error(f"All Gemini models and keys failed in cascade: {last_error}")
            raise last_error
        raise RuntimeError("Gemini generation returned empty text.")

    async def generate_text(self, prompt: str, system_instruction: str | None = None) -> str:
        if not self._client:
            return await self._fallback_provider.generate_text(prompt, system_instruction)

        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                system_instruction=system_instruction
                or "You are an expert clinical documentation AI."
            )
            return await self._call_gemini_generate(contents=prompt, config=config)
        except Exception as e:
            logger.error(
                f"Gemini API error during generate_text: {e}. Falling back to mock output."
            )
            return await self._fallback_provider.generate_text(prompt, system_instruction)

    @staticmethod
    def _clean_schema(d: Any) -> Any:
        if isinstance(d, dict):
            d.pop("additionalProperties", None)
            d.pop("title", None)
            for k, v in list(d.items()):
                GeminiProvider._clean_schema(v)
        elif isinstance(d, list):
            for item in d:
                GeminiProvider._clean_schema(item)
        return d

    async def generate_structured(
        self, prompt: str, schema_class: type[T], system_instruction: str | None = None
    ) -> T:
        if not self._client:
            return await self._fallback_provider.generate_structured(
                prompt, schema_class, system_instruction
            )

        try:
            from google.genai import types

            raw_schema = schema_class.model_json_schema()
            cleaned_schema = self._clean_schema(raw_schema)

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=cleaned_schema,
                system_instruction=system_instruction
                or "Return strictly valid JSON adhering to the specified schema.",
            )
            raw_text = await self._call_gemini_generate(contents=prompt, config=config)

            # Clean potential markdown wrapping
            cleaned = raw_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            data = json.loads(cleaned)
            return schema_class.model_validate(data)
        except Exception as e:
            logger.warning(
                f"Gemini API structured schema error ({e}). Trying prompt-based JSON fallback..."
            )
            try:
                from google.genai import types

                schema_json = json.dumps(schema_class.model_json_schema(), indent=2)
                fallback_prompt = (
                    f"{prompt}\n\nSTRICT JSON OUTPUT REQUIREMENT:\n"
                    f"Respond ONLY with valid JSON matching this schema:\n{schema_json}"
                )
                fallback_config = types.GenerateContentConfig(
                    response_mime_type="application/json",
                    system_instruction=system_instruction or "Return strictly valid JSON only.",
                )
                raw_text = await self._call_gemini_generate(
                    contents=fallback_prompt, config=fallback_config
                )
                cleaned = raw_text.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                data = json.loads(cleaned)
                return schema_class.model_validate(data)
            except Exception as e2:
                logger.error(f"Gemini structured generation failed completely: {e2}")
                raise

    async def normalize_multilingual_transcript(
        self, original_transcript: str
    ) -> MultilingualNormalizationSchema:
        if not self._client:
            return await self._fallback_provider.normalize_multilingual_transcript(
                original_transcript
            )

        template = _read_prompt("multilingual_normalization.txt")
        prompt = template.format(original_transcript=original_transcript)
        try:
            return await self.generate_structured(
                prompt=prompt,
                schema_class=MultilingualNormalizationSchema,
                system_instruction="You are a clinical multilingual translator specializing in Malayalam and English medical dialogues.",
            )
        except Exception as e:
            logger.warning(f"Error in Gemini multilingual normalization: {e}")
            return await self._fallback_provider.normalize_multilingual_transcript(
                original_transcript
            )

    async def analyze_clinical_transcript(
        self, transcript: str, patient_context: dict[str, Any]
    ) -> ClinicalExtractionSchema:
        if not self._client:
            return await self._fallback_provider.analyze_clinical_transcript(
                transcript, patient_context
            )

        template = _read_prompt("clinical_extraction.txt")
        prompt = template.format(
            patient_context=json.dumps(patient_context, indent=2), transcript=transcript
        )
        try:
            return await self.generate_structured(
                prompt=prompt,
                schema_class=ClinicalExtractionSchema,
                system_instruction="Extract clinical findings. Never invent missing information. If vitals or facts are not mentioned, use null or 'Not documented'.",
            )
        except Exception as e:
            logger.warning(f"Error in Gemini clinical extraction: {e}")
            return await self._fallback_provider.analyze_clinical_transcript(
                transcript, patient_context
            )

    async def generate_soap(
        self, extraction: ClinicalExtractionSchema, patient_context: dict[str, Any]
    ) -> SOAPNoteSchema:
        if not self._client:
            return await self._fallback_provider.generate_soap(extraction, patient_context)

        template = _read_prompt("soap_note.txt")
        prompt = template.format(
            clinical_extraction=extraction.model_dump_json(indent=2),
            patient_context=json.dumps(patient_context, indent=2),
        )
        try:
            return await self.generate_structured(
                prompt=prompt,
                schema_class=SOAPNoteSchema,
                system_instruction="Generate SOAP note. Must be labeled AI DRAFT requiring doctor review.",
            )
        except Exception as e:
            logger.warning(f"Error in Gemini SOAP generation: {e}")
            return await self._fallback_provider.generate_soap(extraction, patient_context)

    async def suggest_diagnoses(
        self, extraction: ClinicalExtractionSchema, rag_context: str
    ) -> DiagnosisListSchema:
        if not self._client:
            return await self._fallback_provider.suggest_diagnoses(extraction, rag_context)

        template = _read_prompt("diagnosis.txt")
        prompt = template.format(
            clinical_extraction=extraction.model_dump_json(indent=2), rag_context=rag_context
        )
        try:
            res = await self.generate_structured(
                prompt=prompt,
                schema_class=DiagnosisListSchema,
                system_instruction="Suggest differential diagnoses. Label all diagnoses as 'Suggested Diagnosis' with status 'SUGGESTED'. Never label as confirmed.",
            )
            # Ensure safe status and sources
            for item in res.suggestions:
                item.status = "SUGGESTED"
                if (
                    not rag_context
                    or "No specific reference clinical guidelines retrieved." in rag_context
                    or not settings.RAG_ENABLED
                ):
                    item.source = "No reference source used."
            return res
        except Exception as e:
            logger.warning(f"Error in Gemini diagnosis suggestion: {e}")
            return await self._fallback_provider.suggest_diagnoses(extraction, rag_context)

    async def suggest_investigations(
        self, extraction: ClinicalExtractionSchema, diagnoses: list[str], rag_context: str
    ) -> InvestigationListSchema:
        if not self._client:
            return await self._fallback_provider.suggest_investigations(
                extraction, diagnoses, rag_context
            )

        template = _read_prompt("investigation.txt")
        prompt = template.format(
            clinical_extraction=extraction.model_dump_json(indent=2),
            diagnoses=json.dumps(diagnoses),
            rag_context=rag_context,
        )
        try:
            res = await self.generate_structured(
                prompt=prompt,
                schema_class=InvestigationListSchema,
                system_instruction="Suggest diagnostic investigations according to evidence-based guidelines.",
            )
            for item in res.suggestions:
                if (
                    not rag_context
                    or "No specific reference clinical guidelines retrieved." in rag_context
                    or not settings.RAG_ENABLED
                ):
                    item.source = "No reference source used."
            return res
        except Exception as e:
            logger.warning(f"Error in Gemini investigation suggestion: {e}")
            return await self._fallback_provider.suggest_investigations(
                extraction, diagnoses, rag_context
            )

    async def generate_prescription_draft(
        self, extraction: ClinicalExtractionSchema, diagnoses: list[str], patient_allergies: str
    ) -> PrescriptionDraftSchema:
        if not self._client:
            return await self._fallback_provider.generate_prescription_draft(
                extraction, diagnoses, patient_allergies
            )

        template = _read_prompt("prescription.txt")
        prompt = template.format(
            clinical_extraction=extraction.model_dump_json(indent=2),
            diagnoses=json.dumps(diagnoses),
            patient_allergies=patient_allergies,
        )
        try:
            res = await self.generate_structured(
                prompt=prompt,
                schema_class=PrescriptionDraftSchema,
                system_instruction="Draft prescription proposal. Strictly avoid contraindicated medications. Label as draft requiring doctor approval.",
            )
            # Enforce safety invariant: AI cannot auto-approve items
            for item in res.items:
                item.is_approved = False
            res.disclaimer = "AI-GENERATED PRESCRIPTION DRAFT. REQUIRES DOCTOR APPROVAL. DO NOT DISPENSE AUTOMATICALLY."
            return res
        except Exception as e:
            logger.warning(f"Error in Gemini prescription draft: {e}")
            return await self._fallback_provider.generate_prescription_draft(
                extraction, diagnoses, patient_allergies
            )

    async def suggest_icd_codes(
        self, diagnoses: list[str], extraction: ClinicalExtractionSchema, rag_context: str
    ) -> ICDListSchema:
        if not self._client:
            return await self._fallback_provider.suggest_icd_codes(
                diagnoses, extraction, rag_context
            )

        template = _read_prompt("icd.txt")
        prompt = template.format(
            diagnoses=json.dumps(diagnoses),
            clinical_extraction=extraction.model_dump_json(indent=2),
            rag_context=rag_context,
        )
        try:
            res = await self.generate_structured(
                prompt=prompt,
                schema_class=ICDListSchema,
                system_instruction="Suggest standardized ICD-10 diagnostic codes.",
            )
            for item in res.suggestions:
                item.status = "SUGGESTED"
            return res
        except Exception as e:
            logger.warning(f"Error in Gemini ICD suggestions: {e}")
            return await self._fallback_provider.suggest_icd_codes(
                diagnoses, extraction, rag_context
            )
