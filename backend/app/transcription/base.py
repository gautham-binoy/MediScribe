from abc import ABC, abstractmethod

from pydantic import BaseModel


class TranscriptionSegment(BaseModel):
    speaker: str  # "Doctor", "Patient"
    text: str
    timestamp: str  # "00:05"


class TranscriptionResult(BaseModel):
    original_transcript: str
    normalized_clinical_text: str
    detected_language: str
    segments: list[TranscriptionSegment] = []


class BaseTranscriber(ABC):
    """
    Abstract interface for speech-to-text transcription.
    """

    @abstractmethod
    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        content_type: str = "audio/webm",
        language_preference: str = "Auto Detect",
    ) -> TranscriptionResult:
        """Transcribe an audio buffer into structured verbatim segments and normalized text."""

    @abstractmethod
    def get_demo_transcript(self, scenario: str = "malayalam_fever") -> TranscriptionResult:
        """Retrieve a deterministic, pre-recorded or simulated consultation dialogue."""
