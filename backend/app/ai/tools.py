from typing import Any

from sqlalchemy.orm import Session

from app.models.patient import Patient


class ClinicalTools:
    """
    Safety-bounded tool functions that can be called by Gemini.
    CRITICAL: Tools never directly mutate approved medical records.
    """

    @staticmethod
    def get_patient(db: Session, patient_id: str) -> dict[str, Any]:
        """Fetch patient demographics and profile by patient ID."""
        patient = (
            db.query(Patient)
            .filter((Patient.patient_id == patient_id) | (Patient.id == patient_id))
            .first()
        )
        if not patient:
            return {"status": "error", "message": f"Patient {patient_id} not found"}

        return {
            "status": "success",
            "patient_id": patient.patient_id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "blood_group": patient.blood_group,
            "allergies": patient.allergies,
            "existing_conditions": patient.existing_conditions,
            "current_medications": patient.current_medications,
        }

    @staticmethod
    def get_patient_history(db: Session, patient_id: str) -> dict[str, Any]:
        """Fetch summary of past approved consultations for a patient."""
        patient = (
            db.query(Patient)
            .filter((Patient.patient_id == patient_id) | (Patient.id == patient_id))
            .first()
        )
        if not patient:
            return {"status": "error", "message": f"Patient {patient_id} not found"}

        approved_consultations = [c for c in patient.consultations if c.status == "APPROVED"]
        history = []
        for c in approved_consultations:
            diagnoses = [d.condition for d in c.diagnosis_suggestions if d.status == "ACCEPTED"]
            history.append(
                {
                    "consultation_id": c.consultation_id,
                    "date": c.started_at.strftime("%Y-%m-%d"),
                    "diagnoses": diagnoses,
                    "summary": (
                        c.transcript.normalized_clinical_text[:150] if c.transcript else "N/A"
                    ),
                }
            )
        return {"status": "success", "approved_history": history}

    @staticmethod
    def get_allergies(db: Session, patient_id: str) -> dict[str, Any]:
        """Fetch recorded allergies for patient safety verification."""
        patient = (
            db.query(Patient)
            .filter((Patient.patient_id == patient_id) | (Patient.id == patient_id))
            .first()
        )
        if not patient:
            return {"status": "error", "message": f"Patient {patient_id} not found"}

        return {
            "status": "success",
            "allergies": patient.allergies or "No known drug allergies reported",
        }

    @staticmethod
    def get_current_medications(db: Session, patient_id: str) -> dict[str, Any]:
        """Fetch currently recorded medications for interaction checking."""
        patient = (
            db.query(Patient)
            .filter((Patient.patient_id == patient_id) | (Patient.id == patient_id))
            .first()
        )
        if not patient:
            return {"status": "error", "message": f"Patient {patient_id} not found"}

        return {
            "status": "success",
            "current_medications": patient.current_medications or "None documented",
        }
