import pytest

from app.ai.providers.mock_provider import MockProvider


@pytest.mark.asyncio
async def test_no_information_invention_bp_null():
    """Verify that when patient does not know BP, AI outputs null and does NOT guess."""
    provider = MockProvider()
    dialogue = (
        "Doctor: What is your blood pressure?\nPatient: എനിക്ക് BP അറിയില്ല. I haven't measured it."
    )
    extraction = await provider.analyze_clinical_transcript(dialogue, {})
    # Blood pressure MUST NOT be a guessed number like 120/80
    assert extraction.vitals.get("blood_pressure") is None


@pytest.mark.asyncio
async def test_duration_and_number_extraction():
    """Verify accurate extraction of numbers and durations in clinical transcripts."""
    provider = MockProvider()

    cases = [
        ("Patient reports fever persisting for three days.", "3 days"),
        ("I have had this dry cough for 2 weeks.", "2 weeks"),
        ("Fever for 5 days with chills.", "5 days"),
        ("Symptoms started yesterday.", "Since yesterday"),
    ]

    for transcript, expected_duration in cases:
        ext = await provider.analyze_clinical_transcript(transcript, {})
        assert ext.symptom_duration.lower() == expected_duration.lower()


@pytest.mark.asyncio
async def test_prescription_draft_safety_and_allergy_guard():
    """Verify prescriptions are drafts, require doctor approval, and respect penicillin allergies."""
    provider = MockProvider()

    patient_with_allergy = "Patient has severe penicillin allergy (anaphylaxis)"
    extraction = await provider.analyze_clinical_transcript(
        "Fever for 3 days. എനിക്ക് penicillin allergy ഉണ്ട്.",
        {"allergies": patient_with_allergy},
    )

    rx = await provider.generate_prescription_draft(
        extraction, ["Acute Febrile Illness"], patient_with_allergy
    )

    # 1. Draft disclaimer is present
    assert "AI-GENERATED PRESCRIPTION DRAFT" in rx.disclaimer
    assert "REQUIRES DOCTOR REVIEW" in rx.disclaimer

    # 2. All items must be unapproved by default
    assert len(rx.items) >= 1
    for item in rx.items:
        assert item.is_approved is False

    # 3. Penicillin/Amoxicillin must NOT be prescribed
    med_names = [item.medication_name.lower() for item in rx.items]
    assert not any("amoxicillin" in m or "penicillin" in m or "augmentin" in m for m in med_names)
    assert "penicillin" in rx.general_instructions.lower()


@pytest.mark.asyncio
async def test_diagnosis_safety_status_suggested():
    """Verify AI outputs differential diagnoses labeled SUGGESTED, never confirmed."""
    provider = MockProvider()
    extraction = await provider.analyze_clinical_transcript("Fever for 3 days with cough", {})
    diagnoses = await provider.suggest_diagnoses(extraction, "RAG guideline context")

    for suggestion in diagnoses.suggestions:
        # Never confirmed
        assert suggestion.status == "SUGGESTED"
        assert suggestion.condition != ""
