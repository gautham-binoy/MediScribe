import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Original verbatim transcript with full Malayalam / English code-switching
    original_transcript: Mapped[str] = mapped_column(Text, nullable=False)

    # Normalized clinical English text
    normalized_clinical_text: Mapped[str] = mapped_column(Text, nullable=False)

    clinical_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    detected_language: Mapped[str] = mapped_column(String(50), default="Malayalam + English")

    # Structured diarized segments: [{ speaker: "Doctor"|"Patient", text: "...", timestamp: "00:15" }]
    segments: Mapped[list[dict]] = mapped_column(JSON, default=list)

    @property
    def normalized_transcript(self) -> str:
        return self.normalized_clinical_text

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    consultation: Mapped["Consultation"] = relationship("Consultation", back_populates="transcript")
