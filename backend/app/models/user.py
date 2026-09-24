import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(50), nullable=False, default="DOCTOR"
    )  # DOCTOR, HOSPITAL_ADMIN
    department: Mapped[str] = mapped_column(String(100), nullable=True, default="General Medicine")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    doctor_profile: Mapped["Doctor"] = relationship(
        "Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    license_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    specialization: Mapped[str] = mapped_column(String(100), default="General Medicine")
    hospital: Mapped[str] = mapped_column(
        String(200), default="City Health Multi-Specialty Hospital"
    )
    consultation_room: Mapped[str] = mapped_column(String(50), default="OPD-102")

    user: Mapped["User"] = relationship("User", back_populates="doctor_profile")
    consultations: Mapped[list["Consultation"]] = relationship(
        "Consultation", back_populates="doctor"
    )
