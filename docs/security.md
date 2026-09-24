# MediScribe AI — Security & Compliance Architecture

## 1. Safety Boundary & Non-Autonomous AI
MediScribe AI enforces an architectural boundary separating AI generation from medical record finalization:
- **No Direct Mutation**: AI providers cannot transition any consultation to `APPROVED`.
- **Mandatory Doctor Sign-off**: All electronic health records, prescriptions, and lab orders require explicit human-in-the-loop approval.
- **Cryptographic Signature**: When a doctor approves a record, a SHA-256 hash incorporating the consultation ID, doctor ID, physician license number, and ISO-8601 timestamp is generated and permanently recorded.

---

## 2. Authentication & Authorization
- **JWT (JSON Web Tokens)**: Signed using HMAC-SHA256 (`HS256`) with secret keys kept server-side.
- **Password Hashing**: Salted passwords hashed with `bcrypt` (12 rounds).
- **Role-Based Access Control (RBAC)**:
  - `DOCTOR`: Access to patient roster, consultation initialization, AI review workspace, and approval workflows.
  - `HOSPITAL_ADMIN`: Access to hospital analytics, outpatient governance, and compliance audit trail.

---

## 3. Data Protection & Synthetic Patient Data
- **Synthetic Data Only**: All seeded patients, demographics, phone numbers, and clinical dialogues are strictly synthetic and generated for educational healthcare demonstration.
- **No Secrets in Frontend**: React bundle contains zero API keys or private keys. All external AI calls are mediated through the FastAPI backend.
- **Environment Isolation**: Secret keys are stored in `backend/.env` (excluded via `.gitignore`).
- **Audit Logging**: Every sensitive action (`DOCTOR_LOGIN`, `CONSULTATION_STARTED`, `TRANSCRIPT_GENERATED`, `AI_DRAFT_GENERATED`, `DOCTOR_EDITED_RECORD`, `DOCTOR_APPROVED`) is logged with actor identification, IP address, and timestamp in an immutable `audit_logs` table.
