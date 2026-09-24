# MediScribe AI 🩺
### AI-Powered Clinical Documentation & Hospital Management Copilot

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Alembic](https://img.shields.io/badge/Alembic-1.13+-blue.svg)](https://alembic.sqlalchemy.org)
[![Pytest](https://img.shields.io/badge/pytest-passed%2035%2F35-brightgreen.svg?logo=pytest&logoColor=white)](https://docs.pytest.org)

> **IMPORTANT MEDICAL DISCLAIMER**:
> MediScribe AI is an educational healthcare prototype utilizing **SYNTHETIC PATIENT DATA ONLY**.
> This application is **NOT an autonomous medical system**. All AI-generated outputs (SOAP notes, diagnoses, investigations, prescription proposals, and ICD codes) must always be treated as preliminary drafts. Final clinical authorization and electronic health record creation require explicit physician review and cryptographic sign-off. Never automatically approve or finalize AI-generated clinical records.

---

## 📑 Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Project Structure](#project-structure)
6. [Prerequisites & Requirements](#prerequisites--requirements)
7. [Installation & Setup](#installation--setup)
   - [Linux & macOS Setup](#linux--macos-setup)
   - [Windows Setup](#windows-setup)
   - [Docker Setup](#docker-setup)
   - [PostgreSQL & SQLite Fallback](#postgresql--sqlite-fallback)
8. [Environment Configuration](#environment-configuration)
9. [AI Provider Abstraction](#ai-provider-abstraction)
   - [Gemini Provider](#gemini-provider)
   - [Mock Provider (Offline Expo Mode)](#mock-provider-offline-expo-mode)
   - [OpenAI & Anthropic Extensions](#openai--anthropic-extensions)
10. [Multilingual Support (Malayalam + English)](#multilingual-support-malayalam--english)
11. [RAG (Retrieval-Augmented Generation)](#rag-retrieval-augmented-generation)
12. [Clinical Workflow & Doctor Review](#clinical-workflow--doctor-review)
13. [Hospital Analytics Dashboard](#hospital-analytics-dashboard)
14. [Security & Compliance Audit Logging](#security--compliance-audit-logging)
15. [Running the Application](#running-the-application)
16. [Running Tests](#running-tests)
17. [Troubleshooting Guide](#troubleshooting-guide)
18. [License](#license)

---

## 1. Overview
MediScribe AI assists healthcare practitioners in documenting clinical encounters seamlessly. By analyzing bilingual doctor-patient dialogues conducted in English, Malayalam (മലയാളം), or mixed code-switching, the platform extracts vital symptoms, normalizes colloquial complaints into standard clinical English, and synthesizes structured SOAP notes, differential diagnoses, investigation recommendations, prescription proposals, and ICD-10 suggestions.

The system features an end-to-end physician review workflow with electronic signature verification, longitudinal patient histories, and a hospital management analytics dashboard.

---

## 2. Key Features

- **Doctor-in-the-Loop Safety**: AI output is strictly marked as a draft. Physician review, modification, and explicit sign-off are required.
- **Multilingual Malayalam + English Code-Switching**: Transcribes verbatim Malayalam Unicode dialogue and normalizes colloquial symptoms into professional English EHR documentation without destroying original transcripts.
- **Zero-Dependency Expo Mode**: Runs 100% offline using deterministic `MockProvider` and `MockTranscriber`. Zero paid API keys required.
- **Structured Pydantic Extraction**: Guarantees schema adherence for clinical entities, vitals, red flag warnings, and unanswered questions.
- **SOAP Progress Note Generation**: Synthesizes Subjective, Objective, Assessment, and Plan drafts with explicit disclaimer banners.
- **Prescription Draft & Allergy Safety**: Automatic cross-check against patient allergy records.
- **RAG Guidelines Grounding**: References local clinical practice documents for fever, upper respiratory tract infections, hypertension, diabetes, and ICD-10 mappings.
- **Cryptographic Approval Sign-off**: Generates SHA-256 Approval Record Integrity Hashes containing physician license and timestamp.
- **Hospital Governance Dashboard**: Tracks total patients, today's visits, pending reviews, approved records, and 7-day consultation velocity trends using interactive Recharts.
- **Immutable Audit Trail**: Logs every clinical event from login to approval for regulatory compliance.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (Modern healthcare SaaS design palette)
- **Typography**: Google Fonts Inter & Noto Sans Malayalam
- **Routing**: React Router v6
- **State & Caching**: TanStack Query v5
- **Icons**: Lucide React
- **Analytics & Charts**: Recharts

### Backend
- **Framework**: FastAPI (Python 3.11 / 3.14)
- **Data Validation**: Pydantic v2 & Pydantic-Settings
- **ORM & Database**: SQLAlchemy 2.0 with Alembic migrations
- **Databases**: PostgreSQL (primary) + automatic SQLite fallback for zero-configuration expo reliability
- **Real-Time Streaming**: WebSockets & Web Audio
- **Security**: JWT tokens (HMAC-SHA256) & bcrypt password hashing

### AI & NLP
- **Primary Provider**: Google Gemini (`google-genai` SDK / Gemini 2.5 Flash)
- **Offline Provider**: Deterministic `MockProvider` and `MockTranscriber`
- **Extensions**: `OpenAIProvider` & `AnthropicProvider`
- **Knowledge Engine**: Local RAG keyword indexer and clinical guideline retriever

---

## 4. System Architecture

```
Doctor -> Patient ID -> Consultation -> Audio Stream (English/Malayalam/Mixed)
       -> Real-time Transcription -> Clinical Extraction & Normalization
       -> SOAP Note Draft -> Suggested Diagnoses -> Investigations
       -> Prescription Draft -> ICD Suggestions -> Doctor Review & Edits
       -> Cryptographic Doctor Approval -> Hospital Dashboard & EHR History
```

---

## 5. Project Structure

```
mediscribe-ai/
├── frontend/
│   ├── src/
│   │   ├── api/                  # Typed API client & endpoints
│   │   ├── components/           # UI components (Consultation, Review, Hospital, UI)
│   │   ├── contexts/             # AuthContext, ToastContext
│   │   ├── pages/                # Login, Dashboard, Patients, Review, Hospital, Audit, Settings
│   │   ├── router/               # React Router & ProtectedRoute
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── App.tsx               # Providers wrapper
│   │   ├── main.tsx              # Application mount point
│   │   └── index.css             # Tailwind base & Malayalam font styling
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/
│   ├── app/
│   │   ├── api/                  # API routers (auth, patients, consultations, hospital, audit, health)
│   │   ├── core/                 # Config, security, logging
│   │   ├── auth/                 # Dependencies & RBAC
│   │   ├── db/                   # Base, session, seed scripts
│   │   ├── models/               # SQLAlchemy models (User, Patient, Consultation, etc.)
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── services/             # Business services (Consultation, Patient, Audit)
│   │   ├── ai/                   # AIProvider abstraction, Gemini, Mock, Prompts, Schemas
│   │   ├── transcription/        # BaseTranscriber, Gemini, Mock
│   │   ├── rag/                  # Retriever, indexer, clinical reference documents
│   │   └── main.py               # FastAPI app, CORS, WebSockets
│   ├── alembic/                  # Database migration scripts
│   ├── tests/                    # Pytest test suite (35 comprehensive tests)
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── .env.example
├── docs/                         # architecture.md, api.md, ai.md, demo.md, security.md
├── scripts/                      # seed.py, start-demo.sh, start-demo.ps1
├── docker-compose.yml
├── README.md
└── EXPO_QUICK_START.md
```

---

## 6. Prerequisites & Requirements

- **Python**: 3.11 or higher (Python 3.14 compatible)
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: 9.0+ or higher

---

## 7. Installation & Setup

### Linux & macOS Setup

```bash
# 1. Clone the repository
git clone https://github.com/gautham-binoy/MediScribe.git
cd MediScribe

# 2. Start demo via automated script (handles venv, dependencies, seeding, and execution)
./scripts/start-demo.sh
```

### Windows Setup (PowerShell)

```powershell
# In PowerShell:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\start-demo.ps1
```

### Docker Setup

```bash
docker-compose up --build
```
- Access Frontend at `http://localhost:5173`
- Access Backend API at `http://localhost:8000`

### PostgreSQL & SQLite Fallback
The backend dynamically checks for a running PostgreSQL database. If PostgreSQL is unreachable or unconfigured, the application **automatically falls back to SQLite** (`mediscribe.db`) with zero downtime.

---

## 8. Environment Configuration

Copy the example environment configuration in `backend/.env.example`:
```bash
cp backend/.env.example backend/.env
```

Key environment variables:
```ini
APP_ENV=development
APP_NAME=MediScribe AI
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=sqlite:///./mediscribe.db
AI_PROVIDER=mock
AI_MODEL=gemini-3.1-pro-preview
TRANSCRIPTION_MODEL=gemini-3.5-transcribe
GEMINI_API_KEY=
JWT_SECRET_KEY=mediscribe-ai-super-secret-jwt-key-for-local-demo
DEMO_MODE=true
RAG_ENABLED=true
TRANSCRIPTION_MODE=demo
```

---

## 9. AI Provider Abstraction

MediScribe AI decouples AI implementations behind `AIProvider` (`backend/app/ai/base.py`):

```python
class AIProvider(ABC):
    async def analyze_clinical_transcript(self, transcript: str, patient_context: dict) -> ClinicalExtractionSchema: ...
    async def generate_soap(self, extraction: ClinicalExtractionSchema, patient_context: dict) -> SOAPNoteSchema: ...
    async def suggest_diagnoses(self, extraction: ClinicalExtractionSchema, rag_context: str) -> DiagnosisListSchema: ...
    async def suggest_investigations(self, extraction: ClinicalExtractionSchema, diagnoses: list, rag_context: str) -> InvestigationListSchema: ...
    async def generate_prescription_draft(self, extraction: ClinicalExtractionSchema, diagnoses: list, patient_allergies: str) -> PrescriptionDraftSchema: ...
    async def suggest_icd_codes(self, diagnoses: list, extraction: ClinicalExtractionSchema, rag_context: str) -> ICDListSchema: ...
```

- **MockProvider**: Deterministic offline generator for the Malayalam+English demo scenario.
- **GeminiProvider**: Utilizes `google-genai` SDK with JSON schemas and automatic fallback protection.
- **OpenAI & Anthropic**: Architecture extension points for multi-model deployment.

---

## 10. Multilingual Support (Malayalam + English)

The application handles Malayalam, English, and mixed Manglish code-switching:

**Verbatim Dialogue Preserved**:
- **Doctor**: "എന്താണ് പ്രശ്നം?"
- **Patient**: "Doctor, എനിക്ക് three days ആയി fever ആണ്."
- **Doctor**: "വേറെ എന്തെങ്കിലും symptoms ഉണ്ടോ?"
- **Patient**: "Headache ഉണ്ട്. ഇന്നലെ മുതൽ ചെറിയ cough ഉണ്ട്."
- **Doctor**: "Any allergy?"
- **Patient**: "ഇല്ല doctor, എനിക്ക് medicine allergy ഒന്നും ഇല്ല."

**Normalized Clinical Output**:
- Chief Complaint: Fever for 3 days.
- Associated Symptoms: Headache, mild dry cough since yesterday.
- Drug Allergies: No known drug allergies reported.

---

## 11. RAG (Retrieval-Augmented Generation)

Local evidence-based clinical practice guidelines in `backend/app/rag/documents/`:
- `fever_infectious_diseases.md`
- `upper_respiratory_infections.md`
- `hypertension_cardiovascular.md`
- `type2_diabetes_mellitus.md`
- `icd10_clinical_reference.md`

Guideline citations are retrieved via term-frequency matching and displayed in the review interface.

---

## 12. Clinical Workflow & Doctor Review

1. **Doctor Login**: Authenticate as `doctor@demo.com`.
2. **Search Patient**: Enter `P1001` (Rahul Nair).
3. **Audio Capture**: Record live microphone or trigger preset dialogue simulation.
4. **AI Generation**: Extract structured entities, SOAP note, differential diagnoses, labs, and prescription proposal.
5. **Physician Review**: Edit any clinical field in the workspace.
6. **Explicit Approval**: Doctor clicks "Approve Clinical Record", generating a SHA-256 Approval Record Integrity Hash.

---

## 13. Hospital Analytics Dashboard

Accessible at `/hospital`:
- Total patient census
- Today's consultations count
- Pending reviews vs. approved records
- AI documentation adoption rate (e.g. 94.5%)
- 7-day consultation velocity trend chart (Recharts)
- Recent outpatients table with instant verified medical record inspection

---

## 14. Security & Compliance Audit Logging

- **Role-Based Authorization**: `DOCTOR` and `HOSPITAL_ADMIN` roles.
- **Bcrypt Password Hashing**: 12 rounds of salting.
- **JWT Tokens**: HMAC-SHA256 session tokens.
- **Audit Log Actions**:
  - `DOCTOR_LOGIN`
  - `CONSULTATION_STARTED`
  - `TRANSCRIPT_GENERATED`
  - `AI_DRAFT_GENERATED`
  - `DOCTOR_EDITED_RECORD`
  - `DOCTOR_APPROVED`
  - `HOSPITAL_RECORD_CREATED`

---

## 15. Running the Application

### Backend
```bash
cd backend
source .venv/bin/activate
python -m app.db.seed
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 16. Running Tests

Run the complete backend test suite:
```bash
cd backend
.venv/bin/pytest tests -v
```

All 35 tests will pass:
- Auth & JWT validation (Doctor/Admin login, token expiry, role permissions)
- Patient search & medical history retrieval
- Full consultation lifecycle (Create -> Audio -> AI Draft -> Save -> Approve)
- Multilingual normalization & clinical expressions (English, Malayalam, Mixed Manglish)
- Medical safety & no-information-invention (null vitals when unknown, allergy guard)
- Gemini resilience & failure modes (API key missing, 15s timeout, 429 quota rate limit, malformed JSON, network failure fallback)
- Evidence-based RAG grounding (retrieval, citation, no fabrication)
- Hospital dashboard metrics & trends
- Immutable audit trail logging

Run frontend type check & build validation:
```bash
cd frontend
npm run build
```

---

## 17. Troubleshooting Guide

- **Port 8000 already in use**:
  ```bash
  kill -9 $(lsof -t -i:8000)
  ```
- **Port 5173 already in use**:
  Run `npm run dev -- --port 5174`
- **Database table missing**:
  Run `cd backend && python -m app.db.seed`
- **Microphone permission blocked**:
  Use the built-in **"Preset Dialogue Simulations"** buttons in the UI.

---

## 18. License
Educational healthcare research prototype. MIT License.
