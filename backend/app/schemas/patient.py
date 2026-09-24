from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PatientBase(BaseModel):
    patient_id: str = Field(..., description="Unique alphanumeric ID, e.g. P1001")
    name: str
    dob: str
    age: int
    gender: str
    phone: str
    email: EmailStr | None = None
    address: str | None = None
    blood_group: str | None = None
    allergies: str | None = "No known drug allergies (NKDA)"
    existing_conditions: str | None = "None"
    current_medications: str | None = "None"
    emergency_contact: str | None = None


class PatientCreate(BaseModel):
    name: str
    phone: str
    patient_id: str | None = Field(default=None, description="Optional unique ID. Auto-generated if omitted.")
    dob: str = "1990-01-01"
    age: int | None = None
    gender: str = "Male"
    email: EmailStr | None = None
    address: str | None = None
    blood_group: str | None = "O+"
    allergies: str | None = "No known drug allergies (NKDA)"
    existing_conditions: str | None = "None"
    current_medications: str | None = "None"
    emergency_contact: str | None = None


class PatientUpdate(BaseModel):
    name: str | None = None
    dob: str | None = None
    age: int | None = None
    gender: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    blood_group: str | None = None
    allergies: str | None = None
    existing_conditions: str | None = None
    current_medications: str | None = None
    emergency_contact: str | None = None


class PatientResponse(PatientBase):
    id: str
    created_at: datetime
    updated_at: datetime
    total_consultations: int | None = 0

    model_config = ConfigDict(from_attributes=True)


class PatientHistoryConsultationItem(BaseModel):
    id: str
    consultation_id: str
    status: str
    started_at: datetime
    doctor_name: str | None = None
    chief_complaint: str | None = None
    diagnoses: list[str] = []
    medications: list[str] = []
    is_approved: bool = False
    approved_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PatientHistoryResponse(BaseModel):
    patient: PatientResponse
    consultations: list[PatientHistoryConsultationItem]
