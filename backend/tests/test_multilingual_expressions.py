import pytest

from app.ai.providers.mock_provider import MockProvider


@pytest.mark.asyncio
async def test_pure_english_dialogue():
    provider = MockProvider()
    dialogue = (
        "Doctor: Good morning. How can I help you today?\n"
        "Patient: Good morning doctor. I have had a severe dry cough for 5 days.\n"
        "Doctor: Any fever or chest pain?\n"
        "Patient: No fever, and no chest pain at all. No known drug allergies."
    )
    result = await provider.normalize_multilingual_transcript(dialogue)
    assert result.detected_language == "English"
    assert "cough" in result.normalized_clinical_text.lower()

    extraction = await provider.analyze_clinical_transcript(dialogue, {})
    assert "Cough" in extraction.symptoms
    assert "Chest pain" not in extraction.symptoms
    assert extraction.symptom_duration == "5 days"
    assert "No known drug allergies" in extraction.allergies


@pytest.mark.asyncio
async def test_pure_malayalam_dialogue():
    provider = MockProvider()
    dialogue = "എനിക്ക് മൂന്ന് ദിവസമായി കഠിനമായ തലവേദനയും ക്ഷീണവും ഉണ്ട്."
    result = await provider.normalize_multilingual_transcript(dialogue)
    assert result.detected_language == "Malayalam"
    assert "headache" in result.normalized_clinical_text.lower()

    extraction = await provider.analyze_clinical_transcript(dialogue, {})
    assert "Headache" in extraction.symptoms
    assert extraction.symptom_duration == "3 days"


@pytest.mark.asyncio
async def test_mixed_malayalam_english_code_switching():
    provider = MockProvider()
    dialogue = (
        "Doctor: എന്താണ് പ്രശ്നം?\n"
        "Patient: Doctor, എനിക്ക് three days ആയി fever ആണ്.\n"
        "Doctor: വേറെ എന്തെങ്കിലും symptoms ഉണ്ടോ?\n"
        "Patient: Severe headache ഉണ്ട്. ഇന്നലെ മുതൽ ചെറിയ cough ഉണ്ട്.\n"
        "Doctor: Any drug allergy?\n"
        "Patient: ഇല്ല doctor, എനിക്ക് medicine allergy ഒന്നും ഇല്ല."
    )
    result = await provider.normalize_multilingual_transcript(dialogue)
    assert result.detected_language == "Malayalam + English"
    assert "fever" in result.normalized_clinical_text.lower()

    extraction = await provider.analyze_clinical_transcript(dialogue, {})
    assert "Fever" in extraction.symptoms
    assert "Headache" in extraction.symptoms
    assert extraction.symptom_duration == "3 days"
    assert "No known drug allergies" in extraction.allergies


@pytest.mark.asyncio
async def test_medical_english_terms_inside_malayalam_sentences():
    provider = MockProvider()

    # Statement 1: "എനിക്ക് three days ആയി fever ആണ്."
    stmt1 = "എനിക്ക് three days ആയി fever ആണ്."
    ext1 = await provider.analyze_clinical_transcript(stmt1, {})
    assert "Fever" in ext1.symptoms
    assert ext1.symptom_duration == "3 days"

    # Statement 2: "BP ഇന്നലെ check ചെയ്തപ്പോൾ normal ആയിരുന്നു."
    stmt2 = "BP ഇന്നലെ check ചെയ്തപ്പോൾ normal ആയിരുന്നു."
    ext2 = await provider.analyze_clinical_transcript(stmt2, {})
    assert ext2.vitals.get("blood_pressure") == "Normal (patient reported prior check)"

    # Statement 3: "എനിക്ക് penicillin allergy ഉണ്ട്."
    stmt3 = "എനിക്ക് penicillin allergy ഉണ്ട്."
    ext3 = await provider.analyze_clinical_transcript(stmt3, {})
    assert "Penicillin allergy" in ext3.allergies
    assert any("Penicillin" in w for w in ext3.important_warnings)

    # Statement 4: "Chest pain ഇല്ല." -> NEGATION must be preserved!
    stmt4 = "Doctor, എനിക്ക് fever ഉണ്ട്, but chest pain ഇല്ല."
    ext4 = await provider.analyze_clinical_transcript(stmt4, {})
    assert "Fever" in ext4.symptoms
    assert "Chest pain" not in ext4.symptoms
    assert "denies chest pain" in ext4.history_of_present_illness.lower()


@pytest.mark.asyncio
async def test_language_detection_uncertainty():
    provider = MockProvider()
    ambiguous = "??? ... --- 12345"
    result = await provider.normalize_multilingual_transcript(ambiguous)
    assert "uncertain" in result.detected_language.lower()
