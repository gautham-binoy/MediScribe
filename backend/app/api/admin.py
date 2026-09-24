from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from app.services.patient_service import PatientService
from app.schemas.patient import PatientCreate, PatientResponse
from app.services.audit_service import AuditService
from app.core.security import hash_password
import uuid

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "HOSPITAL_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Hospital Administrators only.",
        )
    return current_user


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all staff users (doctors + admins) in the hospital system."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a new staff user (doctor or admin)."""
    existing = db.query(User).filter(User.email == user_data.get("email")).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email {user_data.get('email')} is already registered.",
        )

    new_user = User(
        id=str(uuid.uuid4()),
        email=user_data["email"],
        full_name=user_data["full_name"],
        hashed_password=hash_password(user_data.get("password", "changeme123")),
        role=user_data.get("role", "DOCTOR"),
        department=user_data.get("department", "General Medicine"),
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    AuditService.log(
        db,
        action="USER_CREATED",
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        target_entity="User",
        target_id=new_user.id,
        details=f"Admin created user: {new_user.full_name} ({new_user.role})",
    )
    return UserResponse.model_validate(new_user)


@router.patch("/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Deactivate a staff account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate your own account"
        )
    user.is_active = False
    db.commit()
    db.refresh(user)
    AuditService.log(
        db,
        action="USER_DEACTIVATED",
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        target_entity="User",
        target_id=user.id,
        details=f"Deactivated user: {user.full_name}",
    )
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Re-activate a staff account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def admin_create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if patient_in.patient_id:
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
        details=f"Admin registered patient: {patient.name} ({patient.patient_id})",
    )
    p_resp = PatientResponse.model_validate(patient)
    p_resp.total_consultations = 0
    return p_resp
