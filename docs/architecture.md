# MediScribe AI — Architectural Design Document

## 1. System Overview
MediScribe AI is an AI-powered clinical documentation and hospital management copilot built as an educational healthcare prototype using synthetic patient data.
The architecture enforces a strict **doctor-in-the-loop safety contract**: AI models propose clinical drafts (SOAP notes, diagnoses, investigations, prescription proposals, ICD-10 suggestions), but **never commit or finalize an electronic health record autonomously**.

## 2. High-Level Architecture Diagram

```
       ┌────────────────────────────────────────────────────────┐
       │                   Vite + React 18                      │
       │  - AudioRecorder (Web Audio / Simulated Preset Streams)│
       │  - Live Malayalam Unicode & English Transcript Card    │
       │  - Doctor Review Workspace (SOAP, Rx, ICD, Diagnoses)  │
       │  - Hospital Governance Dashboard (Recharts Analytics)  │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTP REST / WebSocket
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                   FastAPI Backend                      │
       │  - JWT Authentication & RBAC (Doctor / Hospital Admin) │
       │  - Speech-to-Text Diarization & Audio Pipelines        │
       │  - Clinical State Machine (Recording -> Approved)     │
       │  - Cryptographic Signature Generator (SHA-256)         │
       │  - Comprehensive Compliance Audit Logging              │
       └──────────────┬───────────────────────────┬─────────────┘
                      │                           │
          SQLAlchemy  ▼                           ▼  AI Provider Interface
       ┌──────────────────────┐         ┌───────────────────────────┐
       │ PostgreSQL / SQLite  │         │     AI Provider Engine    │
       │ - Users & Doctors    │         │  - GeminiProvider         │
       │ - Patients           │         │  - MockProvider (Expo)    │
       │ - Consultations      │         │  - OpenAI / Anthropic     │
       │ - Clinical Extractions         └─────────────┬─────────────┘
       │ - Clinical Notes (SOAP)                      │
       │ - Prescriptions & ICD                        ▼
       │ - Digital Approvals            ┌───────────────────────────┐
       │ - Audit Trail Logs   │         │ RAG Clinical Knowledge    │
       └──────────────────────┘         │ - Outpatient Guidelines   │
                                        │ - BM25 / Keyword Indexer  │
                                        │ - Evidence Citations      │
                                        └───────────────────────────┘
```

## 3. Core Subsystems

### A. AI Provider Abstraction
The application decouples all LLM operations behind the `AIProvider` contract (`backend/app/ai/base.py`):
- `generate_text`
- `generate_structured`
- `normalize_multilingual_transcript`
- `analyze_clinical_transcript`
- `generate_soap`
- `suggest_diagnoses`
- `suggest_investigations`
- `generate_prescription_draft`
- `suggest_icd_codes`

Four concrete backends exist:
1. `MockProvider`: 100% offline, deterministic, supporting the dedicated Malayalam + English fever presentation.
2. `GeminiProvider`: Uses `google-genai` with structured Pydantic schemas and auto-fallback to `MockProvider`.
3. `OpenAIProvider`: Structured extension point for GPT-4o.
4. `AnthropicProvider`: Structured extension point for Claude 3.5 Sonnet.

### B. Multilingual Normalization Pipeline
1. Captures verbatim conversation in Malayalam, English, or mixed code-switching (Manglish).
2. Preserves the verbatim Malayalam transcript in Unicode (`Noto Sans Malayalam`).
3. Normalizes colloquial Malayalam symptom descriptions into standardized clinical English.
4. Distinguishes clinical facts from patient hypotheses.

### C. Clinical Decision Support & RAG
- Local evidence-based clinical documents stored in `backend/app/rag/documents/`.
- Fast, zero-dependency term frequency and keyword indexer (`backend/app/rag/indexer.py`).
- Clinical guidelines retrieved dynamically based on symptoms and injected into prompt context.
- Sources are displayed in the review interface for physician transparency.

### D. Consultation State Machine
- `RECORDING`: Consultation active, microphone streaming dialogue.
- `PROCESSING`: AI analyzing dialogue and extracting clinical draft.
- `AI_DRAFT` / `PENDING_REVIEW`: Draft complete; editable by physician.
- `APPROVED`: Explicit physician review and electronic signature attached.
- `REJECTED`: Physician rejected draft with written justification.
