import asyncio
import os
import re
import tempfile

from app.core.config import settings
from app.core.logging import logger
from app.transcription.base import BaseTranscriber, TranscriptionResult, TranscriptionSegment
from app.transcription.mock_transcriber import MockTranscriber


class GeminiTranscriber(BaseTranscriber):
    """
    Multimodal Gemini Audio Transcriber supporting English, Malayalam, and code-switching (Manglish).

    Uses native Google GenAI SDK multimodal audio input with automated model cascade
    (gemini-3.5-flash-lite, gemini-3.5-flash, gemini-3.6-flash, etc.) for high quota resilience.
    Supports MP3, WAV, WebM, M4A, AAC, OGG, FLAC formats.
    Falls back to MockTranscriber only when explicitly in DEMO_MODE or when GEMINI_API_KEY is unset.
    """

    def __init__(self):
        self._fallback = MockTranscriber()
        self.api_key = settings.GEMINI_API_KEY

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        content_type: str = "audio/webm",
        language_preference: str = "Auto Detect",
    ) -> TranscriptionResult:
        """
        Transcribe audio bytes using Gemini multimodal audio model cascade.
        """
        # When demo mode is active or no API key is provided, use deterministic demo mock
        if not self.api_key or settings.DEMO_MODE:
            logger.info("Using mock transcriber (DEMO_MODE=true or no GEMINI_API_KEY).")
            return await self._fallback.transcribe_audio(
                audio_bytes, content_type, language_preference
            )

        if not audio_bytes or len(audio_bytes) < 100:
            return TranscriptionResult(
                original_transcript="[Empty audio received]",
                normalized_clinical_text="No audio data was received for transcription.",
                detected_language="auto",
                segments=[],
            )

        try:
            transcribed_text = await asyncio.wait_for(
                asyncio.to_thread(
                    self._sync_transcribe, audio_bytes, content_type, language_preference
                ),
                timeout=90.0,
            )
        except asyncio.TimeoutError:
            logger.error("Gemini audio transcription timed out after 90s.")
            raise RuntimeError(
                "Gemini audio transcription timed out after 90 seconds. Please try a shorter recording or check your internet connection."
            )
        except Exception as e:
            logger.error(f"Gemini audio transcription failed: {e}")
            raise RuntimeError(
                f"Audio transcription failed: {e}. Please check your audio format or retry."
            ) from e

        if not transcribed_text or not transcribed_text.strip():
            logger.warning("Gemini returned empty transcription text for audio.")
            return TranscriptionResult(
                original_transcript="[No speech detected in audio]",
                normalized_clinical_text="No speech was detected in the submitted audio recording.",
                detected_language="auto",
                segments=[],
            )

        # Parse segments from the raw transcript text (Doctor: / Patient: format)
        segments = self._parse_segments_from_transcript(transcribed_text)

        # Normalize using AI provider
        try:
            from app.ai.factory import get_ai_provider

            ai = get_ai_provider()
            normalized = await ai.normalize_multilingual_transcript(transcribed_text)
            return TranscriptionResult(
                original_transcript=transcribed_text,
                normalized_clinical_text=normalized.normalized_clinical_text,
                detected_language=normalized.detected_language,
                segments=segments,
            )
        except Exception as e:
            logger.warning(f"Transcript normalization warning: {e}. Using raw transcript.")
            return TranscriptionResult(
                original_transcript=transcribed_text,
                normalized_clinical_text=transcribed_text,
                detected_language="auto",
                segments=segments,
            )

    def _sync_transcribe(
        self, audio_bytes: bytes, content_type: str, language_preference: str
    ) -> str:
        """
        Synchronous audio transcription using Google GenAI SDK.
        Sends inline audio Part for audio < 20MB, or uploads via Files API for larger recordings.
        Cascades through candidate models (gemini-3.5-flash-lite, gemini-3.5-flash, gemini-3.6-flash)
        to handle rate limits or demand spikes seamlessly.
        """
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)
        mime_type = self._clean_mime_type(content_type)

        system_prompt = (
            "You are an expert medical transcription specialist for clinical consultations. "
            "Transcribe the doctor-patient consultation audio verbatim and accurately. "
            "The conversation may be in English, Malayalam, or mixed Malayalam-English (code-switching / Manglish). "
            "Preserve exact Malayalam Unicode words and all English medical terminology without translation errors. "
            "Format each speaker change on a new line prefixed with 'Doctor:' or 'Patient:'. "
            "If only one speaker is speaking, prefix each statement with 'Doctor:' or 'Patient:' based on context. "
            f"Language preference: {language_preference}. "
            "Do not output markdown commentary or metadata, only the transcription lines."
        )

        # Model cascade for maximum availability and high quota
        candidate_models = []
        configured = (settings.TRANSCRIPTION_MODEL or "").strip()
        if configured and configured != "gemini-3.5-transcribe":
            candidate_models.append(configured)
        for m in [
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-3.6-flash",
            "gemini-3.1-flash-lite",
            "gemini-3.8-flash",
        ]:
            if m not in candidate_models:
                candidate_models.append(m)

        audio_content = None
        tmp_path = None
        try:
            # Inline audio part for audio under 20MB (ultra-fast, zero Files API roundtrip)
            if len(audio_bytes) < 20 * 1024 * 1024:
                audio_content = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
                logger.info(
                    f"Transcribing {len(audio_bytes)} bytes of {mime_type} audio using inline Part..."
                )
            else:
                ext = self._ext_for_content_type(content_type)
                with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmpf:
                    tmpf.write(audio_bytes)
                    tmp_path = tmpf.name
                logger.info(
                    f"Uploading large audio ({len(audio_bytes)} bytes) to Gemini Files API..."
                )
                audio_content = client.files.upload(file=tmp_path)
                logger.info(f"File uploaded successfully: {audio_content.name}")

            last_error = None
            for model_name in candidate_models:
                try:
                    logger.info(f"Transcribing audio with Gemini model '{model_name}'...")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[audio_content, system_prompt],
                    )
                    text = response.text or ""
                    if text.strip():
                        logger.info(
                            f"Transcription complete with model '{model_name}'. Output: {len(text)} chars."
                        )
                        return text
                except Exception as model_err:
                    err_msg = str(model_err)
                    logger.warning(
                        f"Model '{model_name}' failed during transcription ({err_msg[:120]}). Trying next candidate..."
                    )
                    last_error = model_err
                    continue

            if last_error:
                raise last_error
            raise RuntimeError("All transcription candidate models returned empty responses.")

        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

    def _clean_mime_type(self, content_type: str) -> str:
        """Map content-type string to standard MIME type recognized by Gemini API."""
        clean = (content_type or "audio/webm").lower().split(";")[0].strip()
        mime_map = {
            "audio/mp3": "audio/mp3",
            "audio/mpeg": "audio/mp3",
            "audio/mpeg3": "audio/mp3",
            "audio/x-mpeg-3": "audio/mp3",
            "audio/wav": "audio/wav",
            "audio/x-wav": "audio/wav",
            "audio/wave": "audio/wav",
            "audio/webm": "audio/webm",
            "audio/ogg": "audio/ogg",
            "audio/opus": "audio/ogg",
            "audio/m4a": "audio/mp4",
            "audio/x-m4a": "audio/mp4",
            "audio/mp4": "audio/mp4",
            "audio/aac": "audio/aac",
            "audio/flac": "audio/flac",
            "audio/x-flac": "audio/flac",
            "audio/3gpp": "audio/3gpp",
        }
        return mime_map.get(clean, "audio/webm")

    def _ext_for_content_type(self, content_type: str) -> str:
        """Map audio MIME type to file extension for temp files."""
        clean = (content_type or "audio/webm").lower().split(";")[0].strip()
        mapping = {
            "audio/webm": ".webm",
            "audio/wav": ".wav",
            "audio/x-wav": ".wav",
            "audio/wave": ".wav",
            "audio/mp3": ".mp3",
            "audio/mpeg": ".mp3",
            "audio/mpeg3": ".mp3",
            "audio/x-mpeg-3": ".mp3",
            "audio/ogg": ".ogg",
            "audio/opus": ".opus",
            "audio/flac": ".flac",
            "audio/x-flac": ".flac",
            "audio/mp4": ".m4a",
            "audio/m4a": ".m4a",
            "audio/x-m4a": ".m4a",
            "audio/aac": ".aac",
            "audio/3gpp": ".3gp",
        }
        return mapping.get(clean, ".webm")

    def _parse_segments_from_transcript(self, text: str) -> list[TranscriptionSegment]:
        """
        Parse 'Doctor: ...' / 'Patient: ...' lines from Gemini transcription output
        into structured TranscriptionSegment objects for frontend display.
        """
        segments: list[TranscriptionSegment] = []
        lines = text.strip().splitlines()
        ts_counter = 0
        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Match lines like 'Doctor: text' or 'Patient: text' or 'Dr. Smith: text'
            m = re.match(
                r"^(Doctor|Patient|Dr\.?|Doc|Speaker\s*\d*)\s*:\s*(.+)$", line, re.IGNORECASE
            )
            if m:
                speaker_raw = m.group(1).strip()
                speaker = (
                    "Doctor"
                    if re.match(r"^(doctor|dr\.?|doc)$", speaker_raw, re.IGNORECASE)
                    else "Patient"
                )
                seg_text = m.group(2).strip()
                minutes = ts_counter // 60
                seconds = ts_counter % 60
                timestamp = f"{minutes:02d}:{seconds:02d}"
                segments.append(
                    TranscriptionSegment(speaker=speaker, text=seg_text, timestamp=timestamp)
                )
                ts_counter += max(5, len(seg_text) // 10)
            else:
                # Unmatched line — append to previous segment if exists, else create first segment
                if segments:
                    segments[-1] = TranscriptionSegment(
                        speaker=segments[-1].speaker,
                        text=segments[-1].text + " " + line,
                        timestamp=segments[-1].timestamp,
                    )
                else:
                    segments.append(
                        TranscriptionSegment(speaker="Patient", text=line, timestamp="00:00")
                    )
        return segments

    def get_demo_transcript(self, scenario: str = "malayalam_fever") -> TranscriptionResult:
        return self._fallback.get_demo_transcript(scenario)
