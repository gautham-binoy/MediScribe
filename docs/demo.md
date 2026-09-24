# MediScribe AI — Demo & Expo Presentation Guide

## 1. Quick Startup
To run the complete demonstration on Linux/macOS:
```bash
./scripts/start-demo.sh
```
Or on Windows PowerShell:
```powershell
.\scripts\start-demo.ps1
```

Once running, navigate to `http://localhost:5173` in your browser.

---

## 2. Credentials for Evaluation
- **Attending Doctor Account**:
  - Email: `doctor@demo.com`
  - Password: `doctor123`
- **Hospital Administrator Account**:
  - Email: `admin@demo.com`
  - Password: `admin123`

---

## 3. Recommended 3-Minute Expo Walkthrough

### Step 1: Sign in as Doctor
1. Click the **"Doctor Account"** 1-click button on the login screen (`doctor@demo.com`).
2. Notice the prominent **"DEMO MODE ACTIVE"** indicator confirming zero external API dependencies.

### Step 2: Initialize Consultation
1. Click **"Start Consultation"** from the top bar or sidebar.
2. Select synthetic patient **"P1001 (Rahul Nair)"**.
3. Observe the language controls defaulting to **"Malayalam + English (Mixed)"**.
4. Click **"Launch Consultation Session"**.

### Step 3: Audio & Dialogue Demonstration
1. Click **"Malayalam + English (Fever 3 Days)"** under the Expo Preset Dialogue Simulations.
2. Observe the live dialogue appearing with speaker diarization:
   - **👨‍⚕️ Doctor**: "എന്താണ് പ്രശ്നം?"
   - **👤 Patient**: "Doctor, എനിക്ക് three days ആയി fever ആണ്."
   - **👨‍⚕️ Doctor**: "വേറെ എന്തെങ്കിലും symptoms ഉണ്ടോ?"
   - **👤 Patient**: "Headache ഉണ്ട്. ഇന്നലെ മുതൽ ചെറിയ cough ഉണ്ട്."
   - **👨‍⚕️ Doctor**: "Any allergy?"
   - **👤 Patient**: "ഇല്ല doctor, എനിക്ക് medicine allergy ഒന്നും ഇല്ല."
3. Watch the **AI DETECTED CLINICAL ENTITIES** card update in real-time (`✓ Fever`, `✓ Duration: 3 days`, `✓ Headache`, `✓ NKDA`).

### Step 4: AI Clinical Draft Generation
1. Click **"End Consultation & Generate AI Draft"**.
2. The AI generates the structured clinical draft and lands on the **Doctor Review Workspace**.

### Step 5: Review, Edit, and Sign-off
1. Inspect the **SOAP Progress Note**: Notice the clear banner:
   `AI DRAFT • REQUIRES DOCTOR REVIEW`.
2. Inspect the **Prescription Draft**:
   - Tab. Paracetamol 650mg TDS post-food for 3 days.
   - Tab. Cetirizine 10mg OD bedtime for 3 days.
   - Allergy cross-check confirms no contraindicated medications.
3. Inspect **Diagnoses & Labs**:
   - Acute Viral Pharyngitis / Febrile Syndrome.
   - Complete Blood Count (CBC) with differential.
   - Dengue NS1 Antigen.
4. Click **"Approve Clinical Record"**.
5. In the approval modal, review the physician declaration and click **"Confirm & Sign Record"**.
6. The record displays the cryptographic SHA-256 Approval Record Integrity Hash and physician license certification.

### Step 6: Hospital Quality Governance Dashboard
1. Click **"Hospital Operations"** in the sidebar.
2. Review aggregated KPIs (Total Patients, Approved Records, AI Documentation Adoption Rate).
3. View the 7-day velocity chart and status breakdown.
4. Click on **"Mathew Joseph (P1003)"** in the recent outpatients table to inspect verified historical medical records.
