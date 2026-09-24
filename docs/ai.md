# MediScribe AI — Artificial Intelligence & Clinical NLP Architecture

## 1. Provider Abstraction Principle
MediScribe AI enforces strict abstraction between clinical business logic and LLM implementations. The application never directly couples to proprietary API calls.

```
       ┌────────────────────────┐
       │   AIProvider Contract  │
       └───────────┬────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────┐
    ▼              ▼              ▼              ▼
GeminiProvider MockProvider OpenAIProvider AnthropicProvider
 (Production)     (Expo)        (Stub)         (Stub)
```

### Configuration
Controlled via `backend/.env`:
- `AI_PROVIDER=gemini` (or `mock`, `openai`, `anthropic`)
- `AI_MODEL=gemini-3.1-pro-preview` (Complex medical-document reasoning: clinical extraction, SOAP note, differential diagnosis, prescription draft, ICD-10)
- `TRANSCRIPTION_MODEL=gemini-3.5-transcribe` (Speech → text/transcription for consultation audio)
- `DEMO_MODE=true` (forces MockProvider regardless of configuration for zero-API-key expo reliability)
- `RAG_ENABLED=true`

---

## 2. Multilingual Normalization & Malayalam Unicode
The system supports bilingual code-switching where patients describe symptoms in colloquial Malayalam and doctors converse in English or Malayalam.

### Dedicated Demo Dialogue:
- **Doctor**: "എന്താണ് പ്രശ്നം?"
- **Patient**: "Doctor, എനിക്ക് three days ആയി fever ആണ്."
- **Doctor**: "വേറെ എന്തെങ്കിലും symptoms ഉണ്ടോ?"
- **Patient**: "Headache ഉണ്ട്. ഇന്നലെ മുതൽ ചെറിയ cough ഉണ്ട്."
- **Doctor**: "Any allergy?"
- **Patient**: "ഇല്ല doctor, എനിക്ക് medicine allergy ഒന്നും ഇല്ല."

### Normalized Output:
- **Chief Complaint**: Fever for 3 days.
- **Associated Symptoms**: Moderate headache, mild dry cough since yesterday.
- **Drug Allergies**: No known drug allergies reported.
- **Dialogue Integrity**: The verbatim Malayalam text is preserved in the database and UI alongside the normalized EHR text.

---

## 3. Structured Clinical Extraction Pipeline
All LLM outputs are validated against strict Pydantic v2 models:
1. `ClinicalExtractionSchema`:
   - `chief_complaint`
   - `symptoms` (list of strings)
   - `symptom_duration`
   - `symptom_severity`
   - `history_of_present_illness`
   - `past_medical_history`
   - `allergies`
   - `current_medications`
   - `vitals`
   - `examination_findings`
   - `investigations_mentioned`
   - `medications_mentioned`
   - `important_warnings`
   - `unanswered_questions`
2. `SOAPNoteSchema`: Structured Subjective, Objective, Assessment, Plan.
3. `DiagnosisListSchema`: Differential diagnoses with confidence levels and clinical reasoning.
4. `InvestigationListSchema`: Diagnostic tests recommended with rationale.
5. `PrescriptionDraftSchema`: Formulations with strength, dose, route, frequency, duration, and instructions.
6. `ICDListSchema`: Suggested ICD-10 clinical classifications.

---

## 4. Retrieval-Augmented Generation (RAG)
Local clinical practice reference documents are stored in `backend/app/rag/documents/`:
- `fever_infectious_diseases.md`
- `upper_respiratory_infections.md`
- `hypertension_cardiovascular.md`
- `type2_diabetes_mellitus.md`
- `icd10_clinical_reference.md`

`RAGIndexer` builds an in-memory term frequency and keyword index. `retrieve_guidelines` fetches relevant guidance snippets and cites them in the review interface.

---

## 5. Medical Safety Boundaries
1. **Never Invent Information**: Prompts strictly demand `null` or "Not documented" for unmentioned clinical facts.
2. **Draft-Only Status**: AI generation results in `AI_DRAFT` / `PENDING_REVIEW`. The system architecturally prevents AI from transitioning any record to `APPROVED`.
3. **Physician Sign-off**: Every prescription and diagnosis requires manual physician inspection and electronic signing.
