# MediScribe AI — Expo Quick Start & Presentation Guide

Essential reference card for college technology expo evaluation and live presentations.

---

## 1. Start Backend

### Linux / macOS:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.db.seed
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Windows (PowerShell):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.db.seed
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

---

## 2. Start Frontend

### All Operating Systems:
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

*(Or simply execute `./scripts/start-demo.sh` on Linux/macOS or `.\scripts\start-demo.ps1` on Windows to launch both services in one command).*

---

## 3. URLs & Ports

| Service | Local Address |
| :--- | :--- |
| **Frontend Web Application** | **[http://localhost:5173](http://localhost:5173)** |
| **Backend REST & WebSocket API** | **[http://localhost:8000](http://localhost:8000)** |
| **Swagger Interactive API Documentation** | **[http://localhost:8000/docs](http://localhost:8000/docs)** |
| **Backend Health Check** | **[http://localhost:8000/api/health](http://localhost:8000/api/health)** |

---

## 4. Doctor Credentials (Clinical Workflow)

| Field | Value |
| :--- | :--- |
| **Email** | `doctor@demo.com` *(or click "Demo Doctor" button)* |
| **Password** | `doctor123` |
| **Role & Permissions** | Attending Physician (consultations, audio recording, clinical draft review, inline editing, cryptographic sign-off) |

---

## 5. Admin Credentials (Hospital Management)

| Field | Value |
| :--- | :--- |
| **Email** | `admin@demo.com` *(or click "Demo Admin" button)* |
| **Password** | `admin123` |
| **Role & Permissions** | Hospital Administrator (executive metrics, patient registry management, compliance audit logging) |

---

## 6. Demo Patient

| Field | Details |
| :--- | :--- |
| **Patient ID** | **`P1001`** *(Pre-filled default in consultation creation)* |
| **Name** | **Anitha Nair** (or Rahul Nair in seeded registry) |
| **Demographics** | 28 Years • Female • Blood Group O+ |
| **Allergies** | **Documented Penicillin Allergy** *(Used to showcase safety cross-checks)* |
| **History** | Recurrent Tonsillitis, Acute Upper Respiratory Infections |

---

## 7. Step-by-Step Demo Flow (5–7 Minutes)

1. **Sign In**: Navigate to [http://localhost:5173](http://localhost:5173). Click **"Demo Doctor"** $\rightarrow$ Click **"Sign In"**.
2. **Offline Mode Notice**: Point out the prominent **"DEMO MODE ACTIVE"** badge in the header, demonstrating zero dependency on external paid APIs or internet availability.
3. **Start Consultation**: Click **"Start Demo Consultation"** in the top bar.
4. **Identify Patient**: Patient ID is pre-filled as **`P1001`**. Click **"Find Patient"** $\rightarrow$ Note demographics and penicillin allergy card.
5. **Set Language**: Select **"Malayalam + English"** code-switching mode $\rightarrow$ Click **"Begin Consultation"**.
6. **Simulate Multilingual Audio**:
   - Select preset scenario: **"Malayalam + English Fever Consultation"**.
   - Click **"Simulate Streaming Dialogue"**.
   - Watch the dialogue stream in real time with native Malayalam script (`Noto Sans Malayalam` Unicode font):
     - **Doctor**: *"ഹലോ അനിത, എന്താണ് പ്രശ്നം?"*
     - **Patient**: *"Doctor, എനിക്ക് three days ആയി fever ആണ്. With severe headache and body pain."*
     - **Doctor**: *"Any drug allergy?"*
     - **Patient**: *"എനിക്ക് penicillin allergy ഉണ്ട്."*
7. **Run AI Pipeline**: Click **"Process with MediScribe AI"**.
8. **Doctor Review (Doctor-in-the-Loop)**:
   - Notice the amber **`AI DRAFT`** badges across all clinical modules.
   - Point out that **`blood_pressure: null`** (the AI did not guess or invent a missing BP).
   - Point out the **Allergy Warning Banner**: The AI automatically detected the Penicillin allergy and refused to prescribe Beta-lactams.
   - Click into the **Assessment** or **Plan** and make an inline edit to demonstrate physician authority.
9. **Cryptographic Approval**:
   - Click **"Review & Approve"** $\rightarrow$ Click **"Confirm & Cryptographically Sign"**.
   - Observe the **SHA-256 Approval Record Integrity Hash** sealing the medical record.
10. **Hospital Analytics & Audit**:
    - Switch to **"Hospital Operations"** to see live updated consultation volume and approval rates.
    - View **"Audit Trail"** to show immutable logging of the entire consultation lifecycle.

---

## 8. Gemini Live Setup (Optional)

To demonstrate live Google Gemini processing instead of the offline mock mode:
1. Open `backend/.env`.
2. Add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   AI_PROVIDER=gemini
   DEMO_MODE=false
   ```
3. Restart the backend: `uvicorn app.main:app --host 127.0.0.1 --port 8000`.
4. MediScribe AI will use `gemini-3.1-pro-preview` for complex medical reasoning and `gemini-3.5-transcribe` for audio transcription.

---

## 9. Demo Fallback & Fail-Safe Architecture

- **Zero-Failure Guarantee**: If Gemini API quota is exceeded (HTTP 429), the network disconnects, or the API key expires, MediScribe AI's resilience layer **automatically falls back to the deterministic safety provider without crashing**.
- **Always Keep Demo Mode Ready**: For college expo booths with unstable Wi-Fi, keep `DEMO_MODE=true` in `backend/.env`. It runs 100% locally with zero external network requests.

---

## 10. Emergency Troubleshooting

| Issue / Symptom | Fast Resolution |
| :--- | :--- |
| **Port 8000 already in use** | Run: `lsof -ti:8000 \| xargs kill -9` (Linux/macOS) or kill the process in Task Manager (Windows). |
| **Port 5173 already in use** | Vite will automatically offer port 5174 or run `npm run dev -- --port 5174`. |
| **Database missing or empty** | Run: `cd backend && python -m app.db.seed`. |
| **Microphone blocked by browser** | The app detects denied mic permissions automatically and seamlessly triggers the simulated dialogue. You can also click **"Simulate Streaming Dialogue"**. |
| **Malayalam text shows boxes** | Ensure browser is connected or system has Unicode Malayalam fonts (the frontend bundles Google Fonts `Noto Sans Malayalam`). |
| **Frontend displays network error** | Verify backend is running on `http://127.0.0.1:8000/api/health`. |
