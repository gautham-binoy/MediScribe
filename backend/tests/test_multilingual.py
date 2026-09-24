import pytest

from app.ai.providers.mock_provider import MockProvider
from app.transcription.mock_transcriber import MockTranscriber


@pytest.mark.asyncio
async def test_multilingual_normalization_mixed():
    provider = MockProvider()
    dialogue = (
        "Doctor: എന്താണ് പ്രശ്നം?\n"
        "Patient: Doctor, എനിക്ക് three days ആയി fever ആണ്.\n"
        "Doctor: വേറെ എന്തെങ്കിലും symptoms ഉണ്ടോ?\n"
        "Patient: Headache ഉണ്ട്. ഇന്നലെ മുതൽ ചെറിയ cough ഉണ്ട്.\n"
        "Doctor: Any allergy?\n"
        "Patient: ഇല്ല doctor, എനിക്ക് medicine allergy ഒന്നും ഇല്ല."
    )

    result = await provider.normalize_multilingual_transcript(dialogue)
    assert result.detected_language == "Malayalam + English"
    assert "fever" in result.normalized_clinical_text.lower()
    assert (
        "three days" in result.normalized_clinical_text.lower()
        or "3 days" in result.normalized_clinical_text.lower()
    )
    assert "allergies" in result.normalized_clinical_text.lower()


@pytest.mark.asyncio
async def test_multilingual_normalization_pure_malayalam():
    provider = MockProvider()
    dialogue = "എനിക്ക് മൂന്ന് ദിവസമായി കഠിനമായ തലവേദനയും ക്ഷീണവും ഉണ്ട്."

    result = await provider.normalize_multilingual_transcript(dialogue)
    assert result.detected_language == "Malayalam"
    assert len(result.normalized_clinical_text) > 0


@pytest.mark.asyncio
async def test_multilingual_normalization_pure_english():
    provider = MockProvider()
    dialogue = "Doctor: Good morning. Patient: Hello doctor, I have a persistent cough."

    result = await provider.normalize_multilingual_transcript(dialogue)
    assert result.detected_language == "English"
    assert "cough" in result.normalized_clinical_text.lower()


def test_mock_transcriber_scenarios():
    transcriber = MockTranscriber()

    # 1. Mixed
    res_mixed = transcriber.get_demo_transcript("malayalam_fever")
    assert res_mixed.detected_language == "Malayalam + English"
    assert len(res_mixed.segments) == 6
    assert any("എന്താണ് പ്രശ്നം?" in s.text for s in res_mixed.segments)

    # 2. English
    res_eng = transcriber.get_demo_transcript("english_respiratory")
    assert res_eng.detected_language == "English"
    assert len(res_eng.segments) == 6

    # 3. Pure Malayalam
    res_mal = transcriber.get_demo_transcript("malayalam_pure")
    assert res_mal.detected_language == "Malayalam"
    assert any("തലവേദനയും" in s.text for s in res_mal.segments)
