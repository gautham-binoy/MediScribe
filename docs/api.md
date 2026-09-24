# MediScribe AI — API Specification

The FastAPI backend exposes interactive OpenAPI / Swagger documentation at `/docs` and ReDoc at `/redoc`.

## Base URLs
- Local Development: `http://localhost:8000/api`
- WebSocket Endpoint: `ws://localhost:8000/ws`

---

## 1. Authentication
### `POST /auth/login`
Authenticates a doctor or hospital administrator.
- **Request Body**:
  ```json
  {
    "email": "doctor@demo.com",
    "password": "doctor123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "doctor@demo.com",
      "full_name": "Dr. Gautham Binoy, MD",
      "role": "DOCTOR",
      "department": "Internal Medicine"
    }
  }
  ```

### `GET /auth/me`
Retrieves currently authenticated session profile.

---

## 2. Patients Management
### `GET /patients?search={query}&limit=50`
Searches patients by name, unique patient ID (`P1001`), or phone number.

### `POST /patients`
Registers a new synthetic patient.

### `GET /patients/{id}`
Retrieves demographics, recorded allergies, and chronic conditions.

### `GET /patients/{id}/history`
Retrieves verified longitudinal EHR consultation records.

---

## 3. Consultations & Clinical Workflow
### `POST /consultations`
Initializes a new consultation encounter (`status = RECORDING`).

### `GET /consultations/{id}`
Returns complete consultation details including transcript, clinical extraction, SOAP note, diagnoses, investigations, prescription proposal, and approval status.

### `PUT /consultations/{id}/transcript`
Updates verbatim transcript and normalized text.

### `POST /consultations/{id}/generate`
Triggers AI pipeline to extract clinical facts, generate SOAP progress note, differential diagnoses, investigation recommendations, prescription proposal, and ICD-10 suggestions. Transitions status to `PENDING_REVIEW`.

### `POST /consultations/{id}/draft`
Saves manual edits made by the physician to any clinical field.

### `POST /consultations/{id}/approve`
**Explicit Physician Sign-off**: Generates SHA-256 Approval Record Integrity Hash, marks all prescription items as approved, sets status to `APPROVED`, and commits the record to the permanent EHR registry.

### `POST /consultations/{id}/reject`
Physician rejects the draft with written clinical justification (`status = REJECTED`).

### `POST /consultations/{id}/demo-audio?scenario=malayalam_fever`
Injects deterministic pre-recorded Malayalam+English dialogue for instant offline expo presentation.

---

## 4. Hospital Operations Dashboard
### `GET /hospital/dashboard`
Returns aggregated hospital KPIs:
- Total patients count
- Today's consultations count
- Pending doctor review count
- Approved records count
- AI documentation adoption percentage
- 7-day consultation velocity trend
- Workflow status distribution
- Recent outpatient encounters table

---

## 5. Compliance & Diagnostics
### `GET /audit`
Returns immutable audit logs filtered by action or target entity ID.

### `GET /health`
System liveness and database connectivity probe.

### `GET /health/ai`
AI provider diagnostics showing configured vs active provider, model name, and credential status without exposing secrets.
