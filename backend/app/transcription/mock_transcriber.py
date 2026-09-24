from typing import Any

from app.transcription.base import BaseTranscriber, TranscriptionResult, TranscriptionSegment


class MockTranscriber(BaseTranscriber):
    """
    Mock speech-to-text transcriber providing high-fidelity simulated dialogues.
    Guarantees that demo consultations work reliably without microphone permissions or internet.
    """

    SCENARIOS: dict[str, dict[str, Any]] = {
        "malayalam_fever": {
            "detected_language": "Malayalam + English",
            "segments": [
                {
                    "speaker": "Doctor",
                    "text": "എന്താണ് പ്രശ്നം? (What is the issue?)",
                    "timestamp": "00:04",
                },
                {
                    "speaker": "Patient",
                    "text": "Doctor, എനിക്ക് three days ആയി fever ആണ്.",
                    "timestamp": "00:12",
                },
                {
                    "speaker": "Doctor",
                    "text": "വേറെ എന്തെങ്കിലും symptoms ഉണ്ടോ? (Any other symptoms?)",
                    "timestamp": "00:18",
                },
                {
                    "speaker": "Patient",
                    "text": "Headache ഉണ്ട്. ഇന്നലെ മുതൽ ചെറിയ cough ഉണ്ട്.",
                    "timestamp": "00:26",
                },
                {
                    "speaker": "Doctor",
                    "text": "Any allergy to any medicine or food?",
                    "timestamp": "00:32",
                },
                {
                    "speaker": "Patient",
                    "text": "ഇല്ല doctor, എനിക്ക് medicine allergy ഒന്നും ഇല്ല.",
                    "timestamp": "00:39",
                },
            ],
            "original_transcript": (
                "Doctor: എന്താണ് പ്രശ്നം?\n"
                "Patient: Doctor, എനിക്ക് three days ആയി fever ആണ്.\n"
                "Doctor: വേറെ എന്തെങ്കിലും symptoms ഉണ്ടോ?\n"
                "Patient: Headache ഉണ്ട്. ഇന്നലെ മുതൽ ചെറിയ cough ഉണ്ട്.\n"
                "Doctor: Any allergy?\n"
                "Patient: ഇല്ല doctor, എനിക്ക് medicine allergy ഒന്നും ഇല്ല."
            ),
            "normalized_clinical_text": (
                "Chief complaint: Fever for 3 days.\n"
                "Associated symptoms: Moderate frontal headache, mild dry cough starting from yesterday.\n"
                "Drug allergies: No known drug allergies reported (patient explicitly denies any medicine allergies).\n"
                "Review of Systems: No shortness of breath, no chest pain, no gastrointestinal symptoms reported."
            ),
        },
        "english_respiratory": {
            "detected_language": "English",
            "segments": [
                {
                    "speaker": "Doctor",
                    "text": "Good morning. What brings you in today?",
                    "timestamp": "00:03",
                },
                {
                    "speaker": "Patient",
                    "text": "Hello doctor, I've had a persistent dry cough and sore throat for about four days.",
                    "timestamp": "00:11",
                },
                {
                    "speaker": "Doctor",
                    "text": "Have you noticed any fever, chills, or difficulty swallowing?",
                    "timestamp": "00:18",
                },
                {
                    "speaker": "Patient",
                    "text": "Mild fever on the first two days, around 99.5°F, but no chills. Swallowing hurts a bit.",
                    "timestamp": "00:27",
                },
                {
                    "speaker": "Doctor",
                    "text": "Any history of asthma, drug allergies, or current regular medications?",
                    "timestamp": "00:35",
                },
                {
                    "speaker": "Patient",
                    "text": "No asthma, and no known drug allergies. I take vitamin D supplements occasionally.",
                    "timestamp": "00:43",
                },
            ],
            "original_transcript": (
                "Doctor: Good morning. What brings you in today?\n"
                "Patient: Hello doctor, I've had a persistent dry cough and sore throat for about four days.\n"
                "Doctor: Have you noticed any fever, chills, or difficulty swallowing?\n"
                "Patient: Mild fever on the first two days, around 99.5°F, but no chills. Swallowing hurts a bit.\n"
                "Doctor: Any history of asthma, drug allergies, or current regular medications?\n"
                "Patient: No asthma, and no known drug allergies. I take vitamin D supplements occasionally."
            ),
            "normalized_clinical_text": (
                "Chief complaint: Dry cough and sore throat for 4 days.\n"
                "Associated symptoms: Low-grade fever on initial 2 days (99.5°F), mild odynophagia. Denies dyspnea or chills.\n"
                "Medical history: No asthma. Occasional Vitamin D supplementation.\n"
                "Drug allergies: No known drug allergies (NKDA)."
            ),
        },
        "malayalam_pure": {
            "detected_language": "Malayalam",
            "segments": [
                {
                    "speaker": "Doctor",
                    "text": "സുഖമാണോ? എന്താണ് ഇപ്പോൾ ബുദ്ധിമുട്ട്?",
                    "timestamp": "00:04",
                },
                {
                    "speaker": "Patient",
                    "text": "എനിക്ക് മൂന്ന് ദിവസമായി കഠിനമായ തലവേദനയും ക്ഷീണവും ഉണ്ട്.",
                    "timestamp": "00:14",
                },
                {"speaker": "Doctor", "text": "ഛർദ്ദിയോ കാഴ്ച മങ്ങലോ ഉണ്ടോ?", "timestamp": "00:21"},
                {
                    "speaker": "Patient",
                    "text": "ഇല്ല, പക്ഷേ വെളിച്ചം കാണുമ്പോൾ അസ്വസ്ഥത തോന്നുന്നുണ്ട്.",
                    "timestamp": "00:29",
                },
                {
                    "speaker": "Doctor",
                    "text": "പണ്ടെപ്പോഴെങ്കിലും മൈഗ്രേൻ വന്നിട്ടുണ്ടോ? എന്തെങ്കിലും മരുന്ന് കഴിക്കുന്നുണ്ടോ?",
                    "timestamp": "00:37",
                },
                {
                    "speaker": "Patient",
                    "text": "ഇല്ല ഡോക്ടർ, ആദ്യമായാണ് ഇത്രയും വേദന വരുന്നത്.",
                    "timestamp": "00:45",
                },
            ],
            "original_transcript": (
                "Doctor: സുഖമാണോ? എന്താണ് ഇപ്പോൾ ബുദ്ധിമുട്ട്?\n"
                "Patient: എനിക്ക് മൂന്ന് ദിവസമായി കഠിനമായ തലവേദനയും ക്ഷീണവും ഉണ്ട്.\n"
                "Doctor: ഛർദ്ദിയോ കാഴ്ച മങ്ങലോ ഉണ്ടോ?\n"
                "Patient: ഇല്ല, പക്ഷേ വെളിച്ചം കാണുമ്പോൾ അസ്വസ്ഥത തോന്നുന്നുണ്ട്.\n"
                "Doctor: പണ്ടെപ്പോഴെങ്കിലും മൈഗ്രേൻ വന്നിട്ടുണ്ടോ? എന്തെങ്കിലും മരുന്ന് കഴിക്കുന്നുണ്ടോ?\n"
                "Patient: ഇല്ല ഡോക്ടർ, ആദ്യമായാണ് ഇത്രയും വേദന വരുന്നത്."
            ),
            "normalized_clinical_text": (
                "Chief complaint: Severe headache and generalized fatigue for 3 days.\n"
                "Associated symptoms: Photophobia present. Denies vomiting, visual blurring, or focal neurological deficits.\n"
                "Past history: No previous history of migraine. No regular medications.\n"
                "Allergies: No known drug allergies documented."
            ),
        },
    }

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        content_type: str = "audio/webm",
        language_preference: str = "Auto Detect",
    ) -> TranscriptionResult:
        # For uploaded audio or mock recorded audio, return the rich multilingual scenario
        if (
            "malayalam" in language_preference.lower()
            and "english" not in language_preference.lower()
        ):
            return self.get_demo_transcript("malayalam_pure")
        elif (
            "english" in language_preference.lower()
            and "malayalam" not in language_preference.lower()
        ):
            return self.get_demo_transcript("english_respiratory")
        else:
            return self.get_demo_transcript("malayalam_fever")

    def get_demo_transcript(self, scenario: str = "malayalam_fever") -> TranscriptionResult:
        sc = self.SCENARIOS.get(scenario, self.SCENARIOS["malayalam_fever"])
        segments = [
            TranscriptionSegment(speaker=s["speaker"], text=s["text"], timestamp=s["timestamp"])
            for s in sc["segments"]
        ]
        return TranscriptionResult(
            original_transcript=sc["original_transcript"],
            normalized_clinical_text=sc["normalized_clinical_text"],
            detected_language=sc["detected_language"],
            segments=segments,
        )
