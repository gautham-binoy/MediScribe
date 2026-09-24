from unittest.mock import patch

import pytest

from app.ai.providers.mock_provider import MockProvider
from app.rag.retriever import format_rag_context, retrieve_guidelines


def test_rag_disabled_behavior():
    """Verify that when RAG is disabled, retrieval returns empty without breaking."""
    with patch("app.core.config.settings.RAG_ENABLED", False):
        guidelines = retrieve_guidelines("acute high fever with chills")
        assert guidelines == []

        context = format_rag_context(guidelines)
        assert context == "No specific reference clinical guidelines retrieved."


@pytest.mark.asyncio
async def test_no_source_fabrication_when_rag_empty():
    """Verify that when no RAG guidelines exist, diagnosis source is strictly 'No reference source used.'"""
    provider = MockProvider()
    extraction = await provider.analyze_clinical_transcript("Patient has fever", {})

    # Call with empty RAG context
    with patch("app.core.config.settings.RAG_ENABLED", False):
        diagnoses = await provider.suggest_diagnoses(extraction, "")
        for diag in diagnoses.suggestions:
            assert diag.source == "No reference source used."

        investigations = await provider.suggest_investigations(extraction, ["Fever"], "")
        for inv in investigations.suggestions:
            assert inv.source == "No reference source used."


@pytest.mark.asyncio
async def test_rag_shows_verified_sources_when_available():
    """Verify that when RAG is enabled, verified guideline titles are cited."""
    guidelines = retrieve_guidelines("acute high fever dengue headache", top_k=2)
    assert len(guidelines) > 0
    context = format_rag_context(guidelines)
    assert "Reference Guideline" in context

    provider = MockProvider()
    extraction = await provider.analyze_clinical_transcript("Fever for 3 days", {})
    diagnoses = await provider.suggest_diagnoses(extraction, context)
    assert any("Clinical Reference" in (d.source or "") for d in diagnoses.suggestions)
