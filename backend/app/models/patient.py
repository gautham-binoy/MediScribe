import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )  # e.g., P1001
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    dob: Mapped[str] = mapped_column(String(50), nullable=False)  # YYYY-MM-DD
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)  # Male, Female, Other
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    blood_group: Mapped[str] = mapped_column(String(10), nullable=True)
    allergies: Mapped[str] = mapped_column(
        Text, nullable=True, default="No known drug allergies (NKDA)"
    )
    existing_conditions: Mapped[str] = mapped_column(Text, nullable=True, default="None")
    current_medications: Mapped[str] = mapped_column(Text, nullable=True, default="None")
    emergency_contact: Mapped[str] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    consultations: Mapped[list["Consultation"]] = relationship(
        "Consultation", back_populates="patient", order_by="desc(Consultation.created_at)"
    )
