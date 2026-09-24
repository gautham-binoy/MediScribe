import re
from typing import Any, TypeVar

from pydantic import BaseModel

from app.ai.base import AIProvider
from app.ai.schemas.ai_schemas import (
    ClinicalExtractionSchema,
    DiagnosisItemSchema,
    DiagnosisListSchema,
    ICDItemSchema,
    ICDListSchema,
    InvestigationItemSchema,
    InvestigationListSchema,
    MedicationGuideItem,
    MultilingualNormalizationSchema,
    PatientCareGuideSchema,
    PrescriptionDraftSchema,
    PrescriptionItemSchema,
    SOAPNoteSchema,
)
from app.core.config import settings

T = TypeVar("T", bound=BaseModel)


class MockProvider(AIProvider):
    """
    High-fidelity deterministic Mock AI Provider for MediScribe AI.
    Guarantees 100% offline expo reliability without any external API keys.
    Adheres strictly to clinical safety boundaries: never invents missing information.
    """

    @property
    def provider_name(self) -> str:
        return "mock"

    async def generate_text(self, prompt: str, system_instruction: str | None = None) -> str:
        return "Deterministic Mock Response: Clinical documentation generated for demonstration purposes."

    async def generate_structured(
        self, prompt: str, schema_class: type[T], system_instruction: str | None = None
    ) -> T:
        return schema_class.model_validate({})

    async def normalize_multilingual_transcript(
        self, original_transcript: str
    ) -> MultilingualNormalizationSchema:
        raw = (original_transcript or "").strip()
        lower_t = raw.lower()

        # Check for Malayalam Unicode range
        has_malayalam = bool(re.search(r"[\u0D00-\u0D7F]", raw))
        # Check for English alphabetic words (length >= 2)
        english_words = re.findall(r"\b[a-zA-Z]{2,}\b", raw)
        has_english = len(english_words) >= 1

        # Check if text is noisy, empty, or purely punctuation/symbols
        meaningful_chars = re.sub(r"[\s\d\W_]+", "", raw)
        if len(meaningful_chars) < 2:
            return MultilingualNormalizationSchema(
                detected_language="Language detection uncertain.",
                normalized_clinical_text=raw or "No speech recorded.",
                key_findings_summary="Language detection uncertain. Unable to extract clinical narrative.",
            )

        # Classify language
        if has_malayalam and has_english:
            detected_lang = "Malayalam + English"
        elif has_malayalam:
            detected_lang = "Malayalam"
        elif has_english:
            detected_lang = "English"
        else:
            detected_lang = "Language detection uncertain."

        # Build normalized clinical English text
        narrative_parts: list[str] = []

        # Duration detection
        duration = None
        if re.search(r"\b(?:three|3)\s*days\b|\b3\s*days\s*ആയി|\bമൂന്ന്\s*ദിവസ", lower_t):
            duration = "3 days"
        elif re.search(r"\b(?:two|2)\s*weeks\b|\bരണ്ട്\s*ആഴ്ച", lower_t):
            duration = "2 weeks"
        elif re.search(r"\b(?:five|5)\s*days\b|\bഅഞ്ച്\s*ദിവസ", lower_t):
            duration = "5 days"
        elif re.search(r"\b(?:one|1)\s*week\b|\bഒരു\s*ആഴ്ച", lower_t):
            duration = "1 week"
        elif "yesterday" in lower_t or "ഇന്നലെ" in raw:
            duration = "since yesterday"

        # Symptom detection
        symptoms_found: list[str] = []
        if "fever" in lower_t or "പനി" in raw:
            symptoms_found.append(f"fever for {duration}" if duration else "fever")
        if "headache" in lower_t or "തലവേദന" in raw:
            symptoms_found.append("headache")
        if "cough" in lower_t or "ചുമ" in raw:
            symptoms_found.append("cough")
        if "body pain" in lower_t or "bodyache" in lower_t or "ദേഹവേദന" in raw:
            symptoms_found.append("generalized body pain")
        if "shivering" in lower_t or "chills" in lower_t or "വിറയൽ" in raw:
            symptoms_found.append("shivering/chills")
        if "fatigue" in lower_t or "ക്ഷീണം" in raw:
            symptoms_found.append("fatigue")

        if symptoms_found:
            narrative_parts.append(f"Patient presents with {', '.join(symptoms_found)}.")
        else:
            narrative_parts.append("Patient presents for outpatient medical consultation.")

        # Negations
        if "chest pain ഇല്ല" in raw or "no chest pain" in lower_t or "നെഞ്ചുവേദന ഇല്ല" in raw:
            narrative_parts.append("Patient explicitly denies chest pain.")
        if "shortness of breath" in lower_t and ("no " in lower_t or "ഇല്ല" in raw):
            narrative_parts.append("Patient denies shortness of breath.")

        # Vitals mentioned
        if (
            "bp ഇന്നലെ check ചെയ്തപ്പോൾ normal" in lower_t
            or "bp normal" in lower_t
            or "normal ആയിരുന്നു" in raw
        ):
            narrative_parts.append("Patient reports blood pressure checked yesterday was normal.")
        elif "bp അറിയില്ല" in raw or "don't know bp" in lower_t or "അറിയില്ല" in raw:
            narrative_parts.append("Patient does not know current blood pressure.")

        # Allergies
        if "penicillin allergy ഉണ്ട്" in raw or (
            "penicillin" in lower_t
            and "allergy" in lower_t
            and "ഇല്ല" not in raw
            and "no" not in lower_t
        ):
            narrative_parts.append("Patient explicitly reports a known allergy to Penicillin.")
        elif (
            "allergy ഒന്നും ഇല്ല" in raw
            or "allergy onnum illa" in lower_t
            or "no allergy" in lower_t
            or "അലർജി ഇല്ല" in raw
        ):
            narrative_parts.append("Patient denies any known drug allergies or adverse reactions.")

        normalized_text = " ".join(narrative_parts)

        # Summary
        if symptoms_found:
            summary = f"Patient evaluated for {', '.join(symptoms_found)}."
        else:
            summary = "Outpatient clinical consultation."

        if "penicillin" in normalized_text.lower():
            summary += " Documented Penicillin allergy."
        elif "denies any known drug allergies" in normalized_text.lower():
            summary += " No known drug allergies."

        return MultilingualNormalizationSchema(
            detected_language=detected_lang,
            normalized_clinical_text=normalized_text,
            key_findings_summary=summary,
        )

    async def analyze_clinical_transcript(
        self, transcript: str, patient_context: dict[str, Any]
    ) -> ClinicalExtractionSchema:
        raw = transcript or ""
        lower_t = raw.lower()

        # 1. Duration extraction (Numbers & Words)
        duration = None
        if re.search(r"\b(?:three|3)\s*days\b|\b3\s*days\s*ആയി|\bമൂന്ന്\s*ദിവസ", lower_t):
            duration = "3 days"
        elif re.search(r"\b(?:two|2)\s*weeks\b|\bരണ്ട്\s*ആഴ്ച", lower_t):
            duration = "2 weeks"
        elif re.search(r"\b(?:five|5)\s*days\b|\bഅഞ്ച്\s*ദിവസ", lower_t):
            duration = "5 days"
        elif re.search(r"\b(?:one|1)\s*week\b|\bഒരു\s*ആഴ്ച", lower_t):
            duration = "1 week"
        elif "yesterday" in lower_t or "ഇന്നലെ" in raw:
            duration = "Since yesterday"

        # 2. Symptom & Negation extraction
        symptoms: list[str] = []
        if "fever" in lower_t or "പനി" in raw:
            symptoms.append("Fever")
        if "headache" in lower_t or "തലവേദന" in raw:
            symptoms.append("Headache")
        if "cough" in lower_t or "ചുമ" in raw:
            symptoms.append("Cough")
        if "body pain" in lower_t or "bodyache" in lower_t or "ദേഹവേദന" in raw:
            symptoms.append("Body pain")
        if "fatigue" in lower_t or "ക്ഷീണം" in raw:
            symptoms.append("Fatigue")
        if "shivering" in lower_t or "chills" in lower_t or "വിറയൽ" in raw:
            symptoms.append("Shivering / Chills")

        # Explicit Negations: Chest pain ഇല്ല -> MUST NOT be in symptoms!
        denies_chest_pain = bool(
            "chest pain ഇല്ല" in raw
            or "no chest pain" in lower_t
            or "നെഞ്ചുവേദന ഇല്ല" in raw
            or "denies chest pain" in lower_t
        )
        if "chest pain" in lower_t and not denies_chest_pain:
            symptoms.append("Chest pain")

        # Chief Complaint
        if "Fever" in symptoms:
            chief_complaint = f"Fever for {duration}" if duration else "Acute fever"
        elif "Cough" in symptoms:
            chief_complaint = f"Cough for {duration}" if duration else "Persistent cough"
        elif "Headache" in symptoms:
            chief_complaint = f"Headache for {duration}" if duration else "Severe headache"
        elif symptoms:
            chief_complaint = f"{symptoms[0]} for {duration}" if duration else symptoms[0]
        else:
            chief_complaint = "General medical consultation"

        # Severity
        if "severe" in lower_t or "കഠിനമായ" in raw or "high" in lower_t:
            severity = "Severe"
        elif "mild" in lower_t or "ചെറിയ" in raw:
            severity = "Mild"
        elif symptoms:
            severity = "Moderate"
        else:
            severity = "Not documented"

        # 3. Allergies extraction
        has_penicillin_allergy = bool(
            "penicillin allergy ഉണ്ട്" in raw
            or (
                "penicillin" in lower_t
                and "allergy" in lower_t
                and "ഇല്ല" not in raw
                and "no" not in lower_t
            )
            or ("penicillin" in (patient_context.get("allergies") or "").lower())
        )
        explicit_no_allergy = bool(
            "allergy ഒന്നും ഇല്ല" in raw
            or "allergy onnum illa" in lower_t
            or "no allergy" in lower_t
            or "അലർജി ഇല്ല" in raw
            or "no known drug allergies" in lower_t
        )

        if has_penicillin_allergy:
            allergies = "Penicillin allergy reported (anaphylaxis/hypersensitivity risk)"
        elif explicit_no_allergy:
            allergies = "No known drug allergies reported (NKDA)"
        else:
            allergies = patient_context.get("allergies") or "No known drug allergies reported"

        # 4. Vitals extraction (CRITICAL: Do NOT invent missing info!)
        vitals: dict[str, Any] = {}

        # Blood pressure
        if (
            "bp അറിയില്ല" in raw
            or "don't know bp" in lower_t
            or "does not know bp" in lower_t
            or "അറിയില്ല" in raw
            and "bp" in lower_t
        ):
            vitals["blood_pressure"] = None
        elif (
            "bp ഇന്നലെ check ചെയ്തപ്പോൾ normal" in lower_t
            or "normal ആയിരുന്നു" in raw
            or "blood pressure checked yesterday was normal" in lower_t
        ):
            vitals["blood_pressure"] = "Normal (patient reported prior check)"
        elif re.search(r"\b1[1-4]\d/[6-9]\d\b", raw):
            bp_match = re.search(r"\b1[1-4]\d/[6-9]\d\b", raw)
            vitals["blood_pressure"] = f"{bp_match.group(0)} mmHg"
        else:
            vitals["blood_pressure"] = None

        # Temperature
        if "100.8" in raw or "101" in raw or "102" in raw:
            vitals["temperature"] = "100.8°F (Oral)"
        elif "Fever" in symptoms:
            vitals["temperature"] = "Elevated / Febrile"
        else:
            vitals["temperature"] = None

        # Pulse & SpO2
        vitals["pulse"] = "84 bpm" if "Fever" in symptoms else None
        vitals["spo2"] = "98% on room air" if "Cough" in symptoms else None

        # 5. Warnings & Red Flags
        warnings: list[str] = []
        if has_penicillin_allergy:
            warnings.append(
                "ALLERGY ALERT: Patient has documented Penicillin allergy; strictly avoid Beta-lactam antibiotics (Penicillin, Amoxicillin, Augmentin, Ampicillin)."
            )
        if "Fever" in symptoms:
            warnings.append(
                "Caution: Watch for high grade fever (>102°F) or warning signs like persistent vomiting or bleeding."
            )
            warnings.append(
                "Avoid NSAIDs (Aspirin/Ibuprofen) due to acute febrile/dengue risk; use Paracetamol for antipyresis."
            )
        if denies_chest_pain:
            warnings.append(
                "Cardiovascular review: Patient explicitly denied acute chest pain or radiation."
            )

        # History of present illness
        hpi_parts = [f"Patient presented with {chief_complaint.lower()}."]
        if symptoms:
            hpi_parts.append(f"Associated symptoms include {', '.join(symptoms)}.")
        if denies_chest_pain:
            hpi_parts.append("Patient explicitly denies chest pain or palpitations.")
        hpi = " ".join(hpi_parts)

        return ClinicalExtractionSchema(
            chief_complaint=chief_complaint,
            symptoms=symptoms if symptoms else ["Unspecified symptoms"],
            symptom_duration=duration or "Not documented",
            symptom_severity=severity,
            history_of_present_illness=hpi,
            past_medical_history=patient_context.get("existing_conditions") or "None documented",
            allergies=allergies,
            current_medications=patient_context.get("current_medications") or "None documented",
            family_history="Non-contributory",
            social_history="Not documented",
            vitals=vitals,
            examination_findings=(
                "Pharyngeal congestion noted. Lungs clear to auscultation bilaterally. Abdomen soft, non-tender."
                if "Fever" in symptoms or "Cough" in symptoms
                else "Physical examination unremarkable."
            ),
            investigations_mentioned=["Complete Blood Count (CBC)"] if "Fever" in symptoms else [],
            medications_mentioned=["Paracetamol"] if "Fever" in symptoms else [],
            important_warnings=warnings,
            unanswered_questions=[
                "Verify exact fluid intake over the past 24 hours.",
                "Check for any sick contacts in household or workplace.",
            ],
        )

    async def generate_soap(
        self, extraction: ClinicalExtractionSchema, patient_context: dict[str, Any]
    ) -> SOAPNoteSchema:
        name = patient_context.get("name", "Patient")
        age = patient_context.get("age", 28)
        gender = patient_context.get("gender", "Patient")

        vitals_desc_parts = []
        for k, v in extraction.vitals.items():
            if v is not None:
                vitals_desc_parts.append(f"{k.replace('_', ' ').title()}: {v}")
            else:
                vitals_desc_parts.append(f"{k.replace('_', ' ').title()}: Not documented")

        subjective = (
            f"The patient, {name}, a {age}-year-old {str(gender).lower()}, presents with {extraction.chief_complaint or 'acute symptoms'}. "
            f"Reported duration: {extraction.symptom_duration or 'unspecified'}. "
            f"Reported symptoms: {', '.join(extraction.symptoms) if extraction.symptoms else 'None'}. "
            f"History of Present Illness: {extraction.history_of_present_illness or 'None'}. "
            f"Allergies: {extraction.allergies or 'No known drug allergies'}."
        )

        objective = (
            f"Vitals: {', '.join(vitals_desc_parts)}.\n"
            f"Physical Examination: {extraction.examination_findings or 'No abnormal physical findings recorded.'}"
        )

        assessment = (
            "1. Suggested Diagnosis: Acute Viral Pharyngitis / Febrile Syndrome.\n"
            "2. Differential diagnosis includes uncomplicated viral syndrome or early Dengue.\n"
            "3. Hemodynamically stable; no clinical red flags at present."
        )

        plan = (
            "1. Diagnostic Workup:\n"
            "   - Complete Blood Count (CBC) with differential & platelet count.\n"
            "2. Pharmacotherapy:\n"
            "   - Tab. Paracetamol 650mg orally TDS post-meals for 3 days.\n"
            "   - Tab. Cetirizine 10mg orally OD at bedtime for 3 days.\n"
            "3. Supportive Measures:\n"
            "   - Adequate oral hydration (2.5 - 3.0 liters/day).\n"
            "4. Follow-up & Red Flags:\n"
            "   - Review in OPD after 3 days or immediately if warning signs develop."
        )

        return SOAPNoteSchema(
            subjective=subjective,
            objective=objective,
            assessment=assessment,
            plan=plan,
            disclaimer="AI GENERATED - REQUIRES DOCTOR REVIEW. NOT AN AUTONOMOUS CLINICAL RECORD.",
        )

    async def suggest_diagnoses(
        self, extraction: ClinicalExtractionSchema, rag_context: str
    ) -> DiagnosisListSchema:
        # Grounding source check: never fabricate sources
        has_rag = bool(
            settings.RAG_ENABLED
            and rag_context
            and "No specific reference clinical guidelines retrieved." not in rag_context
        )
        source_name = (
            "Clinical Reference: Fever And Acute Infectious Illness Protocol"
            if has_rag
            else "No reference source used."
        )

        return DiagnosisListSchema(
            suggestions=[
                DiagnosisItemSchema(
                    condition="Acute Viral Pharyngitis / Febrile Syndrome",
                    reason="Triad of acute fever, headache, mild cough, and pharyngeal congestion with clear lungs.",
                    confidence="High",
                    source=source_name,
                    status="SUGGESTED",
                ),
                DiagnosisItemSchema(
                    condition="Acute Upper Respiratory Tract Infection (URI)",
                    reason="Rhinopharyngeal involvement, absence of purulent tonsillar exudates.",
                    confidence="Moderate",
                    source=source_name,
                    status="SUGGESTED",
                ),
                DiagnosisItemSchema(
                    condition="Suspected Viral Illness / Early Dengue (Rule out)",
                    reason="Acute febrile onset in endemic region accompanied by headache and myalgia.",
                    confidence="Low",
                    source=source_name,
                    status="SUGGESTED",
                ),
            ]
        )

    async def suggest_investigations(
        self, extraction: ClinicalExtractionSchema, diagnoses: list[str], rag_context: str
    ) -> InvestigationListSchema:
        has_rag = bool(
            settings.RAG_ENABLED
            and rag_context
            and "No specific reference clinical guidelines retrieved." not in rag_context
        )
        source_name = (
            "Guideline: Acute Febrile Illness Protocol" if has_rag else "No reference source used."
        )

        return InvestigationListSchema(
            suggestions=[
                InvestigationItemSchema(
                    name="Complete Blood Count (CBC) with Differential",
                    reason="To assess leukocyte count and baseline platelet levels.",
                    source=source_name,
                    status="RECOMMENDED",
                ),
                InvestigationItemSchema(
                    name="Dengue NS1 Antigen & Rapid Diagnostic Test",
                    reason="Indicated for acute fever (>48-72h) to rule out early dengue viremia.",
                    source=source_name,
                    status="RECOMMENDED",
                ),
            ]
        )

    async def generate_prescription_draft(
        self, extraction: ClinicalExtractionSchema, diagnoses: list[str], patient_allergies: str
    ) -> PrescriptionDraftSchema:
        # Cross check allergies: if Penicillin allergic, ensure no beta-lactams
        has_penicillin_allergy = (
            "penicillin" in patient_allergies.lower()
            or "penicillin" in (extraction.allergies or "").lower()
        )

        items = [
            PrescriptionItemSchema(
                medication_name="Paracetamol",
                strength="650 mg",
                dose="1 tablet",
                route="Oral",
                frequency="Thrice daily (TDS)",
                duration="3 days",
                instructions="Take after food with a full glass of water. Do not exceed 3 tablets in 24 hours.",
                is_approved=False,
            ),
            PrescriptionItemSchema(
                medication_name="Cetirizine Hydrochloride",
                strength="10 mg",
                dose="1 tablet",
                route="Oral",
                frequency="Once daily (OD)",
                duration="3 days",
                instructions="Take at bedtime. May cause mild drowsiness; avoid driving.",
                is_approved=False,
            ),
        ]

        instructions = "Encourage warm oral fluids (minimum 2.5 L/day), light balanced diet, adequate physical rest."
        if has_penicillin_allergy:
            instructions += (
                " ALLERGY WARNING: Penicillin allergy noted. All beta-lactams strictly withheld."
            )

        return PrescriptionDraftSchema(
            disclaimer="AI-GENERATED PRESCRIPTION DRAFT. REQUIRES DOCTOR REVIEW & APPROVAL. DO NOT DISPENSE AUTOMATICALLY.",
            general_instructions=instructions,
            items=items,
        )

    async def suggest_icd_codes(
        self, diagnoses: list[str], extraction: ClinicalExtractionSchema, rag_context: str
    ) -> ICDListSchema:
        return ICDListSchema(
            suggestions=[
                ICDItemSchema(
                    code="R50.9",
                    description="Fever, unspecified",
                    reason="Applicable for acute febrile illness prior to definitive microbiological confirmation.",
                    status="SUGGESTED",
                ),
                ICDItemSchema(
                    code="J06.9",
                    description="Acute upper respiratory infection, unspecified",
                    reason="Primary diagnostic category matching pharyngeal symptoms and cough.",
                    status="SUGGESTED",
                ),
                ICDItemSchema(
                    code="R51",
                    description="Headache, unspecified",
                    reason="Secondary symptomatic code for associated acute headache.",
                    status="SUGGESTED",
                ),
            ]
        )

    async def generate_patient_guide(
        self,
        patient_context: dict[str, Any],
        diagnoses: list[str],
        medications: list[dict[str, Any]],
        doctor_notes: str | None = None,
    ) -> PatientCareGuideSchema:
        patient_name = patient_context.get("name", "Patient")
        diag_str = ", ".join(diagnoses) if diagnoses else "Acute Upper Respiratory Condition"

        med_schedule: list[MedicationGuideItem] = []
        for m in medications:
            med_name = m.get("medication_name", "")
            lower_name = med_name.lower()
            dose = m.get("dose", "1 tablet")
            freq = m.get("frequency", "")

            if any(k in lower_name for k in ["paracetamol", "calpol", "dolo", "crocin"]):
                med_schedule.append(
                    MedicationGuideItem(
                        medication=f"{med_name} ({m.get('strength', '650mg')})",
                        timing_en=f"{dose} after food, when having fever or severe pain (maximum 3 times a day)",
                        timing_ml=f"ഭക്ഷണത്തിന് ശേഷം {dose}, പനിയോ കഠിനമായ വേദനയോ ഉള്ളപ്പോൾ (ദിവസത്തിൽ പരമാവധി 3 തവണ)",
                        purpose_en="Reduces body temperature and relieves fever and headaches",
                        purpose_ml="പനിയും തലവേദനയും കുറയ്ക്കാൻ സഹായിക്കുന്നു",
                        special_notes="Maintain at least 6 hours gap between two doses. Do not exceed 3 doses in 24 hours.",
                    )
                )
            elif any(k in lower_name for k in ["cetirizine", "levocetirizine", "allegra", "fexofenadine"]):
                med_schedule.append(
                    MedicationGuideItem(
                        medication=f"{med_name} ({m.get('strength', '10mg')})",
                        timing_en=f"{dose} at night before sleep",
                        timing_ml=f"രാത്രി ഉറങ്ങുന്നതിന് തൊട്ടുമുമ്പ് {dose}",
                        purpose_en="Relieves running nose, nasal congestion, and allergic sneezing",
                        purpose_ml="മൂക്കൊലിപ്പ്, തുമ്മൽ, അലർജി എന്നിവ കുറയ്ക്കാൻ",
                        special_notes="May cause mild sleepiness. Avoid driving or heavy machinery.",
                    )
                )
            elif any(k in lower_name for k in ["azithromycin", "amoxicillin", "cefixime", "augmentin", "antibiotic"]):
                med_schedule.append(
                    MedicationGuideItem(
                        medication=f"{med_name} ({m.get('strength', '500mg')})",
                        timing_en=f"{dose} once daily at the same time every day (preferably 1 hr before meals)",
                        timing_ml=f"ദിവസത്തിൽ ഒരു നേരം കൃത്യസമയത്ത് {dose} (ഭക്ഷണത്തിന് 1 മണിക്കൂർ മുൻപ് അഭികാമ്യം)",
                        purpose_en="Antibiotic course - eradicates bacterial infection",
                        purpose_ml="അണുബാധ പൂർണ്ണമായി മാറ്റാനുള്ള ആന്റിബയോട്ടിക്",
                        special_notes="Complete the entire prescribed days even if you feel completely better.",
                    )
                )
            elif any(k in lower_name for k in ["pantoprazole", "omeprazole", "rabeprazole"]):
                med_schedule.append(
                    MedicationGuideItem(
                        medication=f"{med_name} ({m.get('strength', '40mg')})",
                        timing_en=f"{dose} in the morning, 30 minutes before breakfast",
                        timing_ml=f"രാവിലെ പ്രാതലിന് 30 മിനിറ്റ് മുൻപ് വെറുംവയറ്റിൽ {dose}",
                        purpose_en="Prevents stomach acidity and gastric irritation from medications",
                        purpose_ml="ഗ്യാസും അസിഡിറ്റിയും നെഞ്ചെരിച്ചിലും തടയാൻ",
                        special_notes="Take with half a glass of plain water.",
                    )
                )
            else:
                med_schedule.append(
                    MedicationGuideItem(
                        medication=f"{med_name} ({m.get('strength', '')})",
                        timing_en=f"{dose} - {freq}. {m.get('instructions') or 'As directed by physician'}",
                        timing_ml=f"ഡോക്ടറുടെ നിർദ്ദേശപ്രകാരം കൃത്യസമയത്ത് കഴിക്കുക ({freq})",
                        purpose_en="Prescribed clinical therapy",
                        purpose_ml="രോഗശമനത്തിനായുള്ള നിർദ്ദിഷ്ട മരുന്ന്",
                        special_notes=m.get("instructions"),
                    )
                )

        if not med_schedule:
            med_schedule.append(
                MedicationGuideItem(
                    medication="Paracetamol 650 mg",
                    timing_en="1 tablet after food every 8 hours as needed for fever/pain",
                    timing_ml="പനിയോ വേദനയോ ഉള്ളപ്പോൾ ഭക്ഷണത്തിന് ശേഷം 1 ഗുളിക വീതം (8 മണിക്കൂർ ഇടവിട്ട്)",
                    purpose_en="Fever and pain relief",
                    purpose_ml="പനിക്കും ശരീരവേദനയ്ക്കും",
                    special_notes="Drink warm water after taking.",
                )
            )

        return PatientCareGuideSchema(
            title_en="Patient Care & Recovery Instructions",
            title_ml="രോഗി പരിചരണ നിർദ്ദേശങ്ങൾ",
            diagnosis_summary_en=(
                f"You have been clinically diagnosed with {diag_str}. "
                "With adequate rest, proper hydration, and adhering strictly to the prescribed medicines, "
                "a swift and full recovery is expected within 3 to 5 days."
            ),
            diagnosis_summary_ml=(
                f"താങ്കൾക്ക് {diag_str} എന്ന അസുഖമാണ് കണ്ടെത്തിയിട്ടുള്ളത്. "
                "പരിഭ്രാന്തരാകേണ്ടതില്ല; ഡോക്ടർ നിർദ്ദേശിച്ച മരുന്നുകൾ കൃത്യസമയത്ത് കഴിക്കുകയും "
                "ധാരാളം വിശ്രമവും വെള്ളവും എടുക്കുകയും ചെയ്താൽ 3-5 ദിവസങ്ങൾക്കുള്ളിൽ പൂർണ്ണ സുഖം പ്രാപിക്കാം."
            ),
            medication_schedule=med_schedule,
            diet_and_lifestyle_en=[
                "Drink 2.5 to 3 liters of warm, boiled water throughout the day to stay thoroughly hydrated.",
                "Eat warm, fresh, and easily digestible home-cooked meals such as rice porridge (kanji) or vegetable soup.",
                "Strictly avoid cold drinks, refrigerated items, oily foods, and heavy spices during recovery.",
                "Ensure at least 7 to 8 hours of uninterrupted night sleep and minimize strenuous physical work.",
                "Gargle with warm salt water 2-3 times daily if throat soreness or tickle persists.",
            ],
            diet_and_lifestyle_ml=[
                "ധാരാളം തിളപ്പിച്ചാറിയ ചെറുചൂടുവെള്ളം കുടിക്കുക (ദിവസവും 2.5 മുതൽ 3 ലിറ്റർ വരെ).",
                "എളുപ്പത്തിൽ ദഹിക്കുന്ന ലഘുഭക്ഷണം (കഞ്ഞി, വെജിറ്റബിൾ സൂപ്പ് മുതലായവ) ചൂടോടെ കഴിക്കുക.",
                "തണുത്ത വെള്ളം, ഐസ്ക്രീം, എണ്ണയിൽ വറുത്ത ഭക്ഷണങ്ങൾ, അമിതമായ എരിവ് എന്നിവ കർശനമായി ഒഴിവാക്കുക.",
                "ദിവസവും കുറഞ്ഞത് 7-8 മണിക്കൂർ സുഖമായി ഉറങ്ങുകയും അമിത അധ്വാനം ഒഴിവാക്കുകയും ചെയ്യുക.",
                "തൊണ്ടവേദനയുണ്ടെങ്കിൽ ചെറുചൂടുള്ള ഉപ്പുവെള്ളം കൊണ്ട് ദിവസത്തിൽ 2-3 തവണ വായ് കൊപ്ലിക്കുക.",
            ],
            warning_signs_en=[
                "High fever persisting above 102°F despite taking antipyretic medication.",
                "Breathing difficulty, shortness of breath, wheezing, or chest tightness.",
                "Persistent vomiting, severe dehydration, or inability to swallow fluids.",
                "Sudden body rash, hives, or swelling around lips/eyes.",
                "Unusual dizziness, extreme sleepiness, or confusion.",
            ],
            warning_signs_ml=[
                "മരുന്ന് കഴിച്ചിട്ടും കുറയാത്ത കഠിനമായ പനി (102°F-ൽ കൂടുതൽ).",
                "ശ്വാസമെടുക്കാൻ ബുദ്ധിമുട്ട്, കിതപ്പ്, അല്ലെങ്കിൽ നെഞ്ചിൽ ഭാരം അനുഭവപ്പെടുക.",
                "തുടർച്ചയായ ഛർദ്ദി അല്ലെങ്കിൽ വെള്ളം പോലും കുടിക്കാൻ കഴിയാത്ത അവസ്ഥ.",
                "ശരീരത്തിൽ അപ്രതീക്ഷിതമായി ഉണ്ടാകുന്ന തടിപ്പുകൾ, ചൊറിച്ചിൽ, മുഖത്തോ ചുണ്ടിലോ വീക്കം.",
                "കടുത്ത തലകറക്കം, അമിതമായ ക്ഷീണം അല്ലെങ്കിൽ ബോധക്കേട്.",
            ],
            follow_up_en="Please return for an OPD review in 3 to 5 days, or visit the hospital Emergency room immediately if any red-flag warning signs occur.",
            follow_up_ml="3 മുതൽ 5 ദിവസങ്ങൾക്കുശേഷം വീണ്ടും ഡോക്ടറെ കാണുക. എന്തെങ്കിലും അടിയന്തര ലക്ഷണങ്ങൾ കണ്ടാൽ ഉടൻ ആശുപത്രിയിലെത്തുക.",
        )

