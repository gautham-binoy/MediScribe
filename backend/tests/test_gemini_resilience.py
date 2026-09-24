from unittest.mock import MagicMock, patch

import pytest

from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.schemas.ai_schemas import ClinicalExtractionSchema


@pytest.mark.asyncio
async def test_gemini_missing_api_key_fallback():
    """Verify GeminiProvider gracefully falls back to MockProvider when API key is missing."""
    with (
        patch("app.core.config.settings.GEMINI_API_KEY", None),
        patch("app.core.config.settings.DEMO_MODE", False),
    ):
        provider = GeminiProvider()
        assert provider._client is None

        extraction = await provider.analyze_clinical_transcript("Patient has fever for 3 days", {})
        assert isinstance(extraction, ClinicalExtractionSchema)
        assert "Fever" in extraction.symptoms


@pytest.mark.asyncio
async def test_gemini_timeout_handled_gracefully():
    """Verify TimeoutError in Gemini call falls back to MockProvider without crashing."""
    provider = GeminiProvider()
    provider._client = MagicMock()

    # Simulate timeout
    with patch.object(
        provider, "_call_gemini_generate", side_effect=TimeoutError("Request timed out")
    ):
        extraction = await provider.analyze_clinical_transcript(
            "Patient has headache and fever", {}
        )
        assert isinstance(extraction, ClinicalExtractionSchema)
        assert "Headache" in extraction.symptoms or "Fever" in extraction.symptoms


@pytest.mark.asyncio
async def test_gemini_rate_limit_handled_gracefully():
    """Verify HTTP 429 Rate Limit in Gemini call falls back to MockProvider."""
    provider = GeminiProvider()
    provider._client = MagicMock()

    # Simulate 429 ResourceExhausted
    with patch.object(
        provider,
        "_call_gemini_generate",
        side_effect=Exception("429 ResourceExhausted: Quota exceeded"),
    ):
        extraction = await provider.analyze_clinical_transcript("Fever for 3 days", {})
        assert isinstance(extraction, ClinicalExtractionSchema)
        assert "Fever" in extraction.symptoms


@pytest.mark.asyncio
async def test_gemini_malformed_json_recovery():
    """Verify malformed JSON from Gemini is handled and falls back safely."""
    provider = GeminiProvider()
    provider._client = MagicMock()

    # Simulate invalid JSON response
    with patch.object(
        provider,
        "_call_gemini_generate",
        return_value="INVALID NON-JSON RESPONSE {broken",
    ):
        extraction = await provider.analyze_clinical_transcript("Fever for 3 days", {})
        assert isinstance(extraction, ClinicalExtractionSchema)
        assert "Fever" in extraction.symptoms


@pytest.mark.asyncio
async def test_gemini_network_failure_handled():
    """Verify network connection failure in Gemini call falls back gracefully."""
    provider = GeminiProvider()
    provider._client = MagicMock()

    # Simulate network connection error
    with patch.object(
        provider,
        "_call_gemini_generate",
        side_effect=ConnectionError("Failed to resolve host generativelanguage.googleapis.com"),
    ):
        extraction = await provider.analyze_clinical_transcript("Fever for 3 days", {})
        assert isinstance(extraction, ClinicalExtractionSchema)
        assert "Fever" in extraction.symptoms
