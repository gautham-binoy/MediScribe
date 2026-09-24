from datetime import UTC, datetime, timedelta

from app.core.logging import logger
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.audit import AuditLog
from app.models.clinical import (
    Approval,
    ClinicalExtraction,
    ClinicalNote,
    DiagnosisSuggestion,
    ICDSuggestion,
    InvestigationSuggestion,
    Prescription,
    PrescriptionItem,
)
from app.models.consultation import Consultation
from app.models.patient import Patient
from app.models.transcript import Transcript
from app.models.user import Doctor, User


def seed_database():
    """Create all tables and seed synthetic demographic and clinical data."""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    # Column migration check for SQLite
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            res = conn.execute(text("PRAGMA table_info(consultations)")).fetchall()
            col_names = [r[1] for r in res]
            if "patient_guide_english" not in col_names:
                conn.execute(text("ALTER TABLE consultations ADD COLUMN patient_guide_english TEXT"))
            if "patient_guide_malayalam" not in col_names:
                conn.execute(text("ALTER TABLE consultations ADD COLUMN patient_guide_malayalam TEXT"))
            if "patient_guide_json" not in col_names:
                conn.execute(text("ALTER TABLE consultations ADD COLUMN patient_guide_json JSON"))
            conn.commit()
    except Exception as col_err:
        logger.warning(f"Column migration notice: {col_err}")

    db = SessionLocal()
    try:
        # 1. Seed Users & Doctors
        doc_user = db.query(User).filter(User.email == "doctor@demo.com").first()
        if not doc_user:
            logger.info("Seeding Doctor account (doctor@demo.com)...")
            doc_user = User(
                email="doctor@demo.com",
                hashed_password=hash_password("doctor123"),
                full_name="Dr. Gautham Binoy, MD",
                role="DOCTOR",
                department="Internal Medicine",
                is_active=True,
            )
            db.add(doc_user)
            db.flush()

            doctor_profile = Doctor(
                user_id=doc_user.id,
                license_number="KMC-REG-2024-8891",
                specialization="General & Internal Medicine",
                hospital="MediScribe Memorial Multi-Specialty Hospital",
                consultation_room="OPD Suite 204",
            )
            db.add(doctor_profile)

        admin_user = db.query(User).filter(User.email == "admin@demo.com").first()
        if not admin_user:
            logger.info("Seeding Hospital Admin account (admin@demo.com)...")
            admin_user = User(
                email="admin@demo.com",
                hashed_password=hash_password("admin123"),
                full_name="Dr. Sarah Thomas, MD (Medical Director)",
                role="HOSPITAL_ADMIN",
                department="Hospital Quality & Clinical Governance",
                is_active=True,
            )
            db.add(admin_user)

        # 2. Seed 5 Synthetic Patients
        patients_data = [
            {
                "patient_id": "P1001",
                "name": "Rahul Nair",
                "dob": "1997-04-12",
                "age": 28,
                "gender": "Male",
                "phone": "+91 98470 11223",
                "email": "rahul.nair.synth@example.com",
                "address": "Kochi, Ernakulam, Kerala",
                "blood_group": "O+",
                "allergies": "Penicillin allergy (cutaneous urticaria / rash)",
                "existing_conditions": "None reported",
                "current_medications": "None",
                "emergency_contact": "Anita Nair (Spouse) - +91 98470 44556",
            },
            {
                "patient_id": "P1002",
                "name": "Ananya Sharma",
                "dob": "1991-09-24",
                "age": 34,
                "gender": "Female",
                "phone": "+91 94460 33445",
                "email": "ananya.sharma.synth@example.com",
                "address": "Trivandrum, Kerala",
                "blood_group": "B+",
                "allergies": "Penicillin (cutaneous urticaria / rash)",
                "existing_conditions": "Mild intermittent bronchial asthma",
                "current_medications": "Salbutamol inhaler 100mcg PRN",
                "emergency_contact": "Vikram Sharma (Brother) - +91 94460 77889",
            },
            {
                "patient_id": "P1003",
                "name": "Mathew Joseph",
                "dob": "1973-11-05",
                "age": 52,
                "gender": "Male",
                "phone": "+91 98950 55667",
                "email": "mathew.j.synth@example.com",
                "address": "Kottayam, Kerala",
                "blood_group": "A+",
                "allergies": "No known drug allergies (NKDA)",
                "existing_conditions": "Essential Hypertension (Stage 1)",
                "current_medications": "Amlodipine 5mg OD morning",
                "emergency_contact": "Mariamma Joseph (Wife) - +91 98950 99001",
            },
            {
                "patient_id": "P1004",
                "name": "Priya Kurian",
                "dob": "1980-02-18",
                "age": 45,
                "gender": "Female",
                "phone": "+91 97450 77889",
                "email": "priya.k.synth@example.com",
                "address": "Kozhikode, Kerala",
                "blood_group": "AB+",
                "allergies": "Sulfonamides (Bactrim/Septra allergy)",
                "existing_conditions": "Type 2 Diabetes Mellitus (HbA1c 7.1%)",
                "current_medications": "Metformin 500mg BD with meals",
                "emergency_contact": "George Kurian (Husband) - +91 97450 11223",
            },
            {
                "patient_id": "P1005",
                "name": "Arjun Varma",
                "dob": "1964-07-30",
                "age": 61,
                "gender": "Male",
                "phone": "+91 98460 88990",
                "email": "arjun.varma.synth@example.com",
                "address": "Thrissur, Kerala",
                "blood_group": "B-",
                "allergies": "Aspirin (causes epigastric burning / gastritis)",
                "existing_conditions": "Dyslipidemia, Bilateral knee osteoarthritis",
                "current_medications": "Atorvastatin 10mg OD bedtime",
                "emergency_contact": "Deepa Varma (Daughter) - +91 98460 22334",
            },
        ]

        seeded_patients = {}
        for p_data in patients_data:
            existing_p = (
                db.query(Patient).filter(Patient.patient_id == p_data["patient_id"]).first()
            )
            if not existing_p:
                logger.info(f"Seeding synthetic patient: {p_data['name']} ({p_data['patient_id']})")
                p = Patient(**p_data)
                db.add(p)
                db.flush()
                seeded_patients[p.patient_id] = p
            else:
                seeded_patients[existing_p.patient_id] = existing_p

        # 3. Seed an existing APPROVED historical consultation for Mathew Joseph (P1003)
        p1003 = seeded_patients.get("P1003")
        existing_con = (
            db.query(Consultation).filter(Consultation.consultation_id == "CON-2026-0001").first()
        )
        if p1003 and not existing_con and doc_user and doc_user.doctor_profile:
            logger.info("Seeding past approved clinical consultation for P1003...")
            hist_time = datetime.now(UTC) - timedelta(days=14)
            c = Consultation(
                consultation_id="CON-2026-0001",
                patient_id=p1003.id,
                doctor_id=doc_user.doctor_profile.id,
                status="APPROVED",
                conversation_language="English",
                output_language="English",
                detected_language="English",
                duration_seconds=185,
                is_demo=True,
                started_at=hist_time,
                ended_at=hist_time + timedelta(minutes=5),
                created_at=hist_time,
                updated_at=hist_time,
            )
            db.add(c)
            db.flush()

            # Transcript
            tr = Transcript(
                consultation_id=c.id,
                original_transcript=(
                    "Doctor: Hello Mr. Mathew, how has your blood pressure been doing?\n"
                    "Patient: Good morning doctor. Overall okay, but I felt mild morning headaches last week.\n"
                    "Doctor: Are you taking your Amlodipine regularly?\n"
                    "Patient: Yes doctor, every morning without missing."
                ),
                normalized_clinical_text="Routine hypertension follow-up. Patient reports occasional morning occipital headache. Adherent to Amlodipine 5mg OD.",
                detected_language="English",
                segments=[
                    {
                        "speaker": "Doctor",
                        "text": "Hello Mr. Mathew, how has your blood pressure been doing?",
                        "timestamp": "00:03",
                    },
                    {
                        "speaker": "Patient",
                        "text": "Good morning doctor. Overall okay, but I felt mild morning headaches last week.",
                        "timestamp": "00:10",
                    },
                ],
                created_at=hist_time,
            )
            db.add(tr)

            # Clinical Extraction
            ext = ClinicalExtraction(
                consultation_id=c.id,
                chief_complaint="Hypertension routine checkup & mild morning headache",
                symptoms=["Occasional mild morning headache"],
                symptom_duration="1 week",
                symptom_severity="Mild",
                history_of_present_illness="Patient with known Stage 1 HTN on Amlodipine 5mg reports mild morning headaches.",
                past_medical_history="Essential Hypertension",
                allergies="No known drug allergies (NKDA)",
                current_medications="Amlodipine 5mg OD",
                vitals={"blood_pressure": "136/84 mmHg", "pulse": "74 bpm"},
                examination_findings="Cardiovascular exam normal S1 S2 heard. No pedal edema.",
                investigations_mentioned=["Serum Creatinine & Electrolytes"],
                medications_mentioned=["Amlodipine 5mg"],
                important_warnings=["Monitor home BP twice weekly."],
                unanswered_questions=[],
                created_at=hist_time,
            )
            db.add(ext)

            # SOAP
            soap = ClinicalNote(
                consultation_id=c.id,
                subjective="52-year-old male with essential hypertension on Amlodipine 5mg presents for scheduled review. Mild morning headaches.",
                objective="BP: 136/84 mmHg, HR: 74 bpm. S1/S2 normal, no peripheral edema.",
                assessment="Essential hypertension, moderately controlled. Mild tension/vascular headache.",
                plan="Continue Tab Amlodipine 5mg OD. Advise low sodium DASH diet. Routine renal function tests.",
                is_ai_draft=False,
                disclaimer="APPROVED CLINICAL RECORD - SIGNED BY ATTENDING PHYSICIAN",
                doctor_notes="Patient reassured. Advised morning brisk walking.",
                created_at=hist_time,
            )
            db.add(soap)

            # Diagnoses
            d1 = DiagnosisSuggestion(
                consultation_id=c.id,
                condition="Essential (primary) Hypertension",
                reason="Confirmed historical diagnosis with current BP 136/84 on monotherapy.",
                confidence="High",
                source="Clinical Reference: Essential Hypertension Guidelines",
                status="ACCEPTED",
                created_at=hist_time,
            )
            db.add(d1)

            # Investigations
            inv1 = InvestigationSuggestion(
                consultation_id=c.id,
                name="Serum Creatinine and Electrolytes (Na/K)",
                reason="Routine monitoring for hypertensive renal safety.",
                source="Guideline: Essential Workup",
                status="ORDERED",
                created_at=hist_time,
            )
            db.add(inv1)

            # Prescription
            rx = Prescription(
                consultation_id=c.id,
                doctor_id=doc_user.doctor_profile.id,
                status="APPROVED",
                disclaimer="AUTHORIZED CLINICAL PRESCRIPTION - VERIFIED & SIGNED BY DOCTOR",
                general_instructions="Maintain low salt diet (<2g/day) and daily 30-min walking.",
                doctor_signature="APPROVED-SIG-HIST-2026-MATHEW",
                created_at=hist_time,
            )
            db.add(rx)
            db.flush()

            rx_item = PrescriptionItem(
                prescription_id=rx.id,
                medication_name="Amlodipine",
                strength="5 mg",
                dose="1 tablet",
                route="Oral",
                frequency="Once daily (OD) in morning",
                duration="30 days",
                instructions="Take with water after breakfast",
                is_approved=True,
            )
            db.add(rx_item)

            # ICD
            icd1 = ICDSuggestion(
                consultation_id=c.id,
                code="I10",
                description="Essential (primary) hypertension",
                reason="Primary ongoing clinical condition.",
                status="ACCEPTED",
                created_at=hist_time,
            )
            db.add(icd1)

            # Approval
            appr = Approval(
                consultation_id=c.id,
                doctor_id=doc_user.doctor_profile.id,
                doctor_name="Dr. Gautham Binoy, MD",
                doctor_license="KMC-REG-2024-8891",
                doctor_notes="Clinical review complete. BP stable.",
                signature_hash="APPROVED-HASH-SHA256-HIST-MATHEW",
                approved_at=hist_time + timedelta(minutes=5),
            )
            db.add(appr)

        # 4. Seed initial Audit Log
        if not db.query(AuditLog).first():
            AuditLog_init = AuditLog(
                action="SYSTEM_INITIALIZED",
                actor_id="SYSTEM",
                actor_name="System Bootstrapper",
                actor_role="SYSTEM",
                target_entity="System",
                target_id="SYS-001",
                details="MediScribe AI educational system initialized with synthetic seed data.",
                timestamp=datetime.now(UTC),
            )
            db.add(AuditLog_init)

        db.commit()
        logger.info("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
