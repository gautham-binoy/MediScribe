from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.patient import (
    PatientCreate,
    PatientHistoryConsultationItem,
    PatientHistoryResponse,
    PatientResponse,
    PatientUpdate,
)
from app.services.audit_service import AuditService
from app.services.patient_service import PatientService

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=list[PatientResponse])
def get_patients(
    search: str | None = Query(None, description="Search by name, patient ID, or phone"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patients = PatientService.get_all(db, search=search, limit=limit)
    res = []
    for p in patients:
        p_resp = PatientResponse.model_validate(p)
        p_resp.total_consultations = len(p.consultations)
        res.append(p_resp)
    return res


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = PatientService.get_by_id_or_patient_id(db, patient_in.patient_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient ID {patient_in.patient_id} already exists.",
        )

    patient = PatientService.create(db, patient_in)
    AuditService.log(
        db,
        action="PATIENT_CREATED",
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        target_entity="Patient",
        target_id=patient.patient_id,
        details=f"Registered synthetic patient: {patient.name} ({patient.patient_id})",
    )
    p_resp = PatientResponse.model_validate(patient)
    p_resp.total_consultations = 0
    return p_resp


@router.get("/{id}", response_model=PatientResponse)
def get_patient(
    id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    patient = PatientService.get_by_id_or_patient_id(db, id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {id} not found")

    p_resp = PatientResponse.model_validate(patient)
    p_resp.total_consultations = len(patient.consultations)
    return p_resp


@router.put("/{id}", response_model=PatientResponse)
def update_patient(
    id: str,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = PatientService.get_by_id_or_patient_id(db, id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {id} not found")

    updated = PatientService.update(db, patient, patient_in)
    AuditService.log(
        db,
        action="PATIENT_UPDATED",
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        target_entity="Patient",
        target_id=updated.patient_id,
        details=f"Updated patient details for {updated.name}",
    )
    p_resp = PatientResponse.model_validate(updated)
    p_resp.total_consultations = len(updated.consultations)
    return p_resp


@router.get("/{id}/history", response_model=PatientHistoryResponse)
def get_patient_history(
    id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    patient = PatientService.get_by_id_or_patient_id(db, id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {id} not found")

    consultations = PatientService.get_patient_history(db, id)
    history_items = []
    for c in consultations:
        diagnoses = [
            d.condition for d in c.diagnosis_suggestions if d.status in ("ACCEPTED", "SUGGESTED")
        ]
        medications = (
            [item.medication_name for item in c.prescription.items] if c.prescription else []
        )
        chief_complaint = c.clinical_extraction.chief_complaint if c.clinical_extraction else None

        doc_name = None
        if c.doctor and c.doctor.user:
            doc_name = c.doctor.user.full_name

        history_items.append(
            PatientHistoryConsultationItem(
                id=c.id,
                consultation_id=c.consultation_id,
                status=c.status,
                started_at=c.started_at,
                doctor_name=doc_name,
                chief_complaint=chief_complaint,
                diagnoses=diagnoses,
                medications=medications,
                is_approved=(c.status == "APPROVED"),
                approved_at=c.approval.approved_at if c.approval else None,
            )
        )

    p_resp = PatientResponse.model_validate(patient)
    p_resp.total_consultations = len(consultations)

    return PatientHistoryResponse(patient=p_resp, consultations=history_items)
