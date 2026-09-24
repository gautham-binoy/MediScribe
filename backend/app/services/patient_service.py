from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.models.consultation import Consultation
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate


class PatientService:
    @staticmethod
    def get_all(db: Session, search: str | None = None, limit: int = 50) -> list[Patient]:
        query = db.query(Patient)
        if search:
            search_fmt = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Patient.patient_id.ilike(search_fmt),
                    Patient.name.ilike(search_fmt),
                    Patient.phone.ilike(search_fmt),
                )
            )
        return query.order_by(Patient.patient_id).limit(limit).all()

    @staticmethod
    def get_by_id_or_patient_id(db: Session, identifier: str) -> Patient | None:
        return (
            db.query(Patient)
            .filter(or_(Patient.id == identifier, Patient.patient_id == identifier))
            .first()
        )

    @staticmethod
    def create(db: Session, patient_in: PatientCreate) -> Patient:
        data = patient_in.model_dump()
        if not data.get("patient_id"):
            count = db.query(Patient).count()
            data["patient_id"] = f"P{1001 + count}"
        if not data.get("age"):
            try:
                from datetime import date
                dob_parts = [int(p) for p in data.get("dob", "1990-01-01").split("-")]
                dob_date = date(dob_parts[0], dob_parts[1], dob_parts[2])
                today = date.today()
                data["age"] = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
            except Exception:
                data["age"] = 30

        patient = Patient(**data)
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient

    @staticmethod
    def update(db: Session, patient: Patient, patient_in: PatientUpdate) -> Patient:
        update_data = patient_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(patient, field, value)
        db.commit()
        db.refresh(patient)
        return patient

    @staticmethod
    def get_patient_history(db: Session, patient_id: str) -> list[Consultation]:
        patient = PatientService.get_by_id_or_patient_id(db, patient_id)
        if not patient:
            return []
        return (
            db.query(Consultation)
            .filter(Consultation.patient_id == patient.id)
            .order_by(desc(Consultation.created_at))
            .all()
        )
