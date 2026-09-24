import pytest

from app.ai.factory import get_ai_provider
from app.ai.schemas.ai_schemas import (
    ClinicalExtractionSchema,
    DiagnosisListSchema,
    ICDListSchema,
    InvestigationListSchema,
    PrescriptionDraftSchema,
    SOAPNoteSchema,
)


@pytest.mark.asyncio
async def test_mock_ai_pipeline():
    ai = get_ai_provider()
    patient_context = {
        "name": "Rahul Nair",
        "age": 28,
        "gender": "Male",
        "allergies": "No known drug allergies",
        "existing_conditions": "None",
        "current_medications": "None",
    }
    transcript = "Doctor: എന്താണ് പ്രശ്നം? Patient: Doctor, എനിക്ക് three days ആയി fever ആണ്. Headache ഉണ്ട്."

    # 1. Extraction
    extraction = await ai.analyze_clinical_transcript(transcript, patient_context)
    assert isinstance(extraction, ClinicalExtractionSchema)
    assert extraction.chief_complaint == "Fever for 3 days"
    assert "Fever" in extraction.symptoms

    # 2. SOAP
    soap = await ai.generate_soap(extraction, patient_context)
    assert isinstance(soap, SOAPNoteSchema)
    assert "Subjective" in soap.subjective or "presents with" in soap.subjective
    assert "AI GENERATED" in soap.disclaimer

    # 3. Diagnoses
    diagnoses = await ai.suggest_diagnoses(extraction, "RAG Fever guideline")
    assert isinstance(diagnoses, DiagnosisListSchema)
    assert len(diagnoses.suggestions) >= 2
    assert diagnoses.suggestions[0].status == "SUGGESTED"

    # 4. Investigations
    diag_names = [d.condition for d in diagnoses.suggestions]
    investigations = await ai.suggest_investigations(extraction, diag_names, "RAG guideline")
    assert isinstance(investigations, InvestigationListSchema)
    assert any(
        "CBC" in inv.name or "Complete Blood Count" in inv.name
        for inv in investigations.suggestions
    )

    # 5. Prescription Draft
    rx = await ai.generate_prescription_draft(extraction, diag_names, patient_context["allergies"])
    assert isinstance(rx, PrescriptionDraftSchema)
    assert len(rx.items) >= 1
    assert rx.items[0].is_approved is False
    assert "AI-GENERATED PRESCRIPTION DRAFT" in rx.disclaimer

    # 6. ICD
    icd = await ai.suggest_icd_codes(diag_names, extraction, "RAG ICD guideline")
    assert isinstance(icd, ICDListSchema)
    codes = [item.code for item in icd.suggestions]
    assert "R50.9" in codes
