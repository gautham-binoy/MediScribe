from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.consultation import Consultation
from app.models.user import User
from app.schemas.clinical import (
    ApprovalRequest,
    ApprovalResponse,
    ClinicalExtractionResponse,
    DiagnosisResponse,
    InvestigationResponse,
    PrescriptionResponse,
    RejectionRequest,
    SaveDraftRequest,
    SOAPNoteResponse,
    SOAPNoteUpdate,
)
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationDetailResponse,
    ConsultationResponse,
    PatientCareGuideUpdateRequest,
    SafetyCheckRequest,
    TranscriptResponse,
    TranscriptUpdateRequest,
)
from app.services.consultation_service import ConsultationService
from app.services.pdf_service import PrescriptionPDFGenerator
from app.services.safety_service import SafetyAlert, SafetyCheckerService
from app.transcription.gemini_transcriber import GeminiTranscriber
from app.transcription.mock_transcriber import MockTranscriber
from app.core.logging import logger
from fastapi.responses import StreamingResponse
from io import BytesIO

router = APIRouter(prefix="/consultations", tags=["Consultations"])



@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def create_consultation(
    consultation_in: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        consultation = ConsultationService.create_consultation(
            db=db,
            patient_id=consultation_in.patient_id,
            doctor_user=current_user,
            conversation_language=consultation_in.conversation_language,
            output_language=consultation_in.output_language,
            is_demo=consultation_in.is_demo,
        )
        return ConsultationResponse.model_validate(consultation)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[ConsultationResponse])
def get_consultations(
    limit: int = Query(50, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Consultation)
    if status_filter:
        query = query.filter(Consultation.status == status_filter)
    consultations = query.order_by(desc(Consultation.created_at)).limit(limit).all()
    return [ConsultationResponse.model_validate(c) for c in consultations]


@router.get("/{id}", response_model=ConsultationDetailResponse)
def get_consultation(
    id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    consultation = ConsultationService.get_by_id_or_code(db, id)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Consultation {id} not found"
        )

    detail = ConsultationDetailResponse.model_validate(consultation)

    # Collect RAG source references
    sources = set()
    for d in consultation.diagnosis_suggestions:
        if d.source:
            sources.add(d.source)
    for inv in consultation.investigation_suggestions:
        if inv.source:
            sources.add(inv.source)
    detail.rag_sources = list(sources)

    # Live Pharmacology & Allergy Conflict Checks
    rx_items = []
    if consultation.prescription and consultation.prescription.items:
        rx_items = [
            {
                "medication_name": item.medication_name,
                "strength": item.strength,
                "dose": item.dose,
                "route": item.route,
                "frequency": item.frequency,
                "duration": item.duration,
            }
            for item in consultation.prescription.items
        ]
    patient = consultation.patient
    safety_alerts = SafetyCheckerService.check_prescription_safety(
        patient_allergies=patient.allergies if patient else None,
        patient_conditions=patient.existing_conditions if patient else None,
        patient_medications=patient.current_medications if patient else None,
        prescribed_items=rx_items,
    )
    detail.safety_alerts = safety_alerts
    return detail



@router.put("/{id}/transcript", response_model=TranscriptResponse)
def update_transcript(
    id: str,
    transcript_in: TranscriptUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        transcript = ConsultationService.update_transcript(
            db=db,
            consultation_id=id,
            original_transcript=transcript_in.original_transcript,
            normalized_clinical_text=transcript_in.normalized_clinical_text,
            clinical_summary=transcript_in.clinical_summary,
            detected_language=transcript_in.detected_language,
            segments=transcript_in.segments,
            actor=current_user,
        )
        return TranscriptResponse.model_validate(transcript)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/generate", response_model=ConsultationDetailResponse)
async def generate_clinical_drafts(
    id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Generate AI clinical documentation draft (SOAP, Diagnoses, Investigations, Prescription, ICD).
    Output is strictly a draft requiring doctor review and explicit approval.
    """
    try:
        consultation = await ConsultationService.generate_ai_drafts(
            db=db, consultation_id=id, actor=current_user
        )
        return get_consultation(consultation.id, db, current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"AI generation failed: {e!s}"
        )


@router.get("/{id}/clinical-extraction", response_model=Optional[ClinicalExtractionResponse])
def get_clinical_extraction(
    id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    consultation = ConsultationService.get_by_id_or_code(db, id)
    if not consultation or not consultation.clinical_extraction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Clinical extraction not found"
        )
    return ClinicalExtractionResponse.model_validate(consultation.clinical_extraction)


@router.get("/{id}/soap", response_model=Optional[SOAPNoteResponse])
def get_soap(
    id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    consultation = ConsultationService.get_by_id_or_code(db, id)
    if not consultation or not consultation.clinical_note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOAP note not found")
    return SOAPNoteResponse.model_validate(consultation.clinical_note)


@router.put("/{id}/soap", response_model=SOAPNoteResponse)
def update_soap(
    id: str,
    soap_in: SOAPNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    consultation = ConsultationService.get_by_id_or_code(db, id)
    if not consultation or not consultation.clinical_note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOAP note not found")

    for field, val in soap_in.model_dump(exclude_unset=True).items():
        setattr(consultation.clinical_note, field, val)
    db.commit()
    db.refresh(consultation.clinical_note)
    return SOAPNoteResponse.model_validate(consultation.clinical_note)


@router.get("/{id}/diagnoses", response_model=list[DiagnosisResponse])
def get_diagnoses(
    id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    consultation = ConsultationService.get_by_id_or_code(db, id)
    if not consultation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")
    return [DiagnosisResponse.model_validate(d) for d in consultation.diagnosis_suggestions]


@router.get("/{id}/investigations", response_model=list[InvestigationResponse])
def get_investigations(
    id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    consultation = ConsultationService.get_by_id_or_code(db, id)
    if not consultation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")
    return [
        InvestigationResponse.model_validate(inv) for inv in consultation.investigation_suggestions
    ]


@router.get("/{id}/prescription", response_model=Optional[PrescriptionResponse])
def get_prescription(
    id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    consultation = ConsultationService.get_by_id_or_code(db, id)
    if not consultation or not consultation.prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Prescription draft not found"
        )
    return PrescriptionResponse.model_validate(consultation.prescription)


@router.post("/{id}/draft", response_model=ConsultationDetailResponse)
def save_draft(
    id: str,
    draft_in: SaveDraftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        ConsultationService.save_draft(db, id, draft_in, current_user)
        return get_consultation(id, db, current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/approve", response_model=ApprovalResponse)
def approve_consultation(
    id: str,
    approval_in: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["DOCTOR", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only registered physicians or clinical administrators may approve clinical records.",
        )
    try:
        approval = ConsultationService.approve_consultation(db, id, approval_in, current_user)
        return ApprovalResponse.model_validate(approval)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/reject", response_model=ConsultationResponse)
def reject_consultation(
    id: str,
    reject_in: RejectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["DOCTOR", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only registered physicians or clinical administrators may reject clinical records.",
        )
    try:
        consultation = ConsultationService.reject_consultation(db, id, reject_in, current_user)
        return ConsultationResponse.model_validate(consultation)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/demo-audio", response_model=TranscriptResponse)
def trigger_demo_audio_transcript(
    id: str,
    scenario: str = Query(
        "malayalam_fever", description="malayalam_fever | english_respiratory | malayalam_pure"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger pre-recorded or simulated demo dialogue for instant expo presentation."""
    mock_transcriber = MockTranscriber()
    res = mock_transcriber.get_demo_transcript(scenario)

    transcript = ConsultationService.update_transcript(
        db=db,
        consultation_id=id,
        original_transcript=res.original_transcript,
        normalized_clinical_text=res.normalized_clinical_text,
        detected_language=res.detected_language,
        segments=res.segments,
        actor=current_user,
    )
    return TranscriptResponse.model_validate(transcript)


@router.post("/{id}/audio-upload", response_model=TranscriptResponse)
async def upload_audio_file(
    id: str,
    file: UploadFile = File(...),
    language_preference: str = Form("Auto Detect"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transcribe uploaded audio file using Gemini audio or fallback mock."""
    content = await file.read()
    content_type = file.content_type
    # Infer content-type from filename extension if generic
    if not content_type or content_type in ("application/octet-stream", "binary/octet-stream"):
        fname = (file.filename or "").lower()
        if fname.endswith(".mp3"):
            content_type = "audio/mp3"
        elif fname.endswith(".wav"):
            content_type = "audio/wav"
        elif fname.endswith(".webm"):
            content_type = "audio/webm"
        elif fname.endswith((".m4a", ".mp4")):
            content_type = "audio/mp4"
        elif fname.endswith((".ogg", ".opus")):
            content_type = "audio/ogg"
        elif fname.endswith(".flac"):
            content_type = "audio/flac"
        elif fname.endswith(".aac"):
            content_type = "audio/aac"
        else:
            content_type = "audio/webm"

    transcriber = GeminiTranscriber()
    try:
        res = await transcriber.transcribe_audio(
            audio_bytes=content,
            content_type=content_type,
            language_preference=language_preference,
        )
    except Exception as e:
        logger.error(f"Audio transcription endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Transcription failed: {str(e)}",
        )

    transcript = ConsultationService.update_transcript(
        db=db,
        consultation_id=id,
        original_transcript=res.original_transcript,
        normalized_clinical_text=res.normalized_clinical_text,
        detected_language=res.detected_language,
        segments=res.segments,
        actor=current_user,
    )
    return TranscriptResponse.model_validate(transcript)


@router.get("/{id}/prescription-pdf")
def download_prescription_pdf(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and stream high-definition official hospital prescription PDF."""
    consultation = ConsultationService.get_by_id_or_code(db, id)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Consultation {id} not found"
        )

    try:
        pdf_bytes = PrescriptionPDFGenerator.generate(consultation)
        filename = f"Prescription_{consultation.consultation_id}.pdf"
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
            },
        )
    except Exception as e:
        logger.error(f"Failed to generate prescription PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}",
        )


@router.post("/{id}/safety-check", response_model=list[SafetyAlert])
def check_medication_safety(
    id: str,
    payload: SafetyCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Live Drug-Allergy & Drug-Drug Conflict Checker.
    Validates any custom or current list of prescribed items against
    patient's documented allergies and chronic condition profile.
    """
    consultation = ConsultationService.get_by_id_or_code(db, id)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Consultation {id} not found"
        )

    patient = consultation.patient
    alerts = SafetyCheckerService.check_prescription_safety(
        patient_allergies=patient.allergies if patient else None,
        patient_conditions=patient.existing_conditions if patient else None,
        patient_medications=patient.current_medications if patient else None,
        prescribed_items=payload.items,
    )
    return alerts


@router.post("/{id}/patient-guide", response_model=ConsultationDetailResponse)
async def regenerate_patient_care_guide(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Regenerate Bilingual Patient Care Guide (Malayalam + English) using AI."""
    try:
        consultation = await ConsultationService.regenerate_patient_guide_for_consultation(
            db=db, consultation_id=id, actor=current_user
        )
        return get_consultation(id=consultation.id, db=db, current_user=current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{id}/patient-guide", response_model=ConsultationDetailResponse)
def update_patient_care_guide(
    id: str,
    guide_in: PatientCareGuideUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save doctor's edits to the Bilingual Patient Care Guide."""
    try:
        consultation = ConsultationService.update_patient_guide(
            db=db,
            consultation_id=id,
            guide_english=guide_in.patient_guide_english,
            guide_malayalam=guide_in.patient_guide_malayalam,
            guide_json=guide_in.patient_guide_json,
            actor=current_user,
        )
        return get_consultation(id=consultation.id, db=db, current_user=current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

