import hashlib
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.ai.factory import get_ai_provider
from app.ai.schemas.ai_schemas import PatientCareGuideSchema
from app.core.logging import logger
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
from app.models.user import User
from app.rag.retriever import format_rag_context, retrieve_guidelines
from app.schemas.clinical import (
    ApprovalRequest,
    RejectionRequest,
    SaveDraftRequest,
)
from app.services.audit_service import AuditService


class ConsultationService:
    @staticmethod
    def generate_consultation_code(db: Session) -> str:
        year = datetime.now(UTC).year
        count = db.query(Consultation).count() + 1
        return f"CON-{year}-{count:04d}"

    @staticmethod
    def get_by_id_or_code(db: Session, identifier: str) -> Consultation | None:
        return (
            db.query(Consultation)
            .filter((Consultation.id == identifier) | (Consultation.consultation_id == identifier))
            .first()
        )

    @staticmethod
    def create_consultation(
        db: Session,
        patient_id: str,
        doctor_user: User,
        conversation_language: str = "Auto Detect",
        output_language: str = "English",
        is_demo: bool = True,
    ) -> Consultation:
        patient = (
            db.query(Patient)
            .filter((Patient.id == patient_id) | (Patient.patient_id == patient_id))
            .first()
        )
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")

        doctor_profile = doctor_user.doctor_profile
        doctor_id = doctor_profile.id if doctor_profile else None

        consultation = Consultation(
            consultation_id=ConsultationService.generate_consultation_code(db),
            patient_id=patient.id,
            doctor_id=doctor_id,
            status="RECORDING",
            conversation_language=conversation_language,
            output_language=output_language,
            detected_language=(
                "Malayalam + English" if "malayalam" in conversation_language.lower() else "English"
            ),
            is_demo=is_demo,
            started_at=datetime.now(UTC),
        )
        db.add(consultation)
        db.commit()
        db.refresh(consultation)

        AuditService.log(
            db,
            action="CONSULTATION_STARTED",
            actor_id=doctor_user.id,
            actor_name=doctor_user.full_name,
            actor_role=doctor_user.role,
            target_entity="Consultation",
            target_id=consultation.consultation_id,
            details=f"New consultation initialized for Patient {patient.name} ({patient.patient_id})",
        )

        return consultation

    @staticmethod
    def update_transcript(
        db: Session,
        consultation_id: str,
        original_transcript: str,
        normalized_clinical_text: str | None = None,
        clinical_summary: str | None = None,
        detected_language: str | None = "Malayalam + English",
        segments: list[dict[str, Any]] | None = None,
        actor: User | None = None,
    ) -> Transcript:
        consultation = ConsultationService.get_by_id_or_code(db, consultation_id)
        if not consultation:
            raise ValueError(f"Consultation {consultation_id} not found")

        # Fallback if normalized text is not passed
        if not normalized_clinical_text:
            normalized_clinical_text = original_transcript

        transcript = consultation.transcript
        if not transcript:
            transcript = Transcript(
                consultation_id=consultation.id,
                original_transcript=original_transcript,
                normalized_clinical_text=normalized_clinical_text,
                clinical_summary=clinical_summary,
                detected_language=detected_language or "Malayalam + English",
                segments=[
                    s.model_dump() if hasattr(s, "model_dump") else s for s in (segments or [])
                ],
            )
            db.add(transcript)
        else:
            transcript.original_transcript = original_transcript
            transcript.normalized_clinical_text = normalized_clinical_text
            if clinical_summary is not None:
                transcript.clinical_summary = clinical_summary
            transcript.detected_language = detected_language or transcript.detected_language
            transcript.segments = [
                s.model_dump() if hasattr(s, "model_dump") else s for s in (segments or [])
            ]

        consultation.detected_language = transcript.detected_language
        db.commit()
        db.refresh(transcript)

        AuditService.log(
            db,
            action="TRANSCRIPT_GENERATED",
            actor_id=actor.id if actor else None,
            actor_name=actor.full_name if actor else "System",
            actor_role=actor.role if actor else "SYSTEM",
            target_entity="Transcript",
            target_id=consultation.consultation_id,
            details=f"Verbatim and normalized transcript updated. Detected language: {transcript.detected_language}",
        )

        return transcript

    @staticmethod
    async def generate_ai_drafts(
        db: Session, consultation_id: str, actor: User | None = None
    ) -> Consultation:
        consultation = ConsultationService.get_by_id_or_code(db, consultation_id)
        if not consultation:
            raise ValueError(f"Consultation {consultation_id} not found")

        consultation.status = "PROCESSING"
        db.commit()

        ai = get_ai_provider()
        transcript = consultation.transcript
        patient = consultation.patient

        transcript_text = (
            transcript.normalized_clinical_text
            if transcript
            else "Patient presents for consultation."
        )
        original_transcript = transcript.original_transcript if transcript else transcript_text

        patient_context = {
            "patient_id": patient.patient_id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "blood_group": patient.blood_group,
            "allergies": patient.allergies,
            "existing_conditions": patient.existing_conditions,
            "current_medications": patient.current_medications,
        }

        # 1. RAG retrieval
        guidelines = retrieve_guidelines(f"{patient.existing_conditions} {transcript_text}")
        rag_context = format_rag_context(guidelines)

        # 2. Multilingual Normalization if not already performed
        if transcript and (
            not transcript.normalized_clinical_text
            or transcript.normalized_clinical_text == transcript.original_transcript
        ):
            norm_res = await ai.normalize_multilingual_transcript(original_transcript)
            transcript.normalized_clinical_text = norm_res.normalized_clinical_text
            transcript.clinical_summary = norm_res.key_findings_summary
            transcript.detected_language = norm_res.detected_language
            consultation.detected_language = norm_res.detected_language
            transcript_text = norm_res.normalized_clinical_text

        # 3. Clinical Extraction
        extraction = await ai.analyze_clinical_transcript(transcript_text, patient_context)

        # Save or update ClinicalExtraction
        ext_model = consultation.clinical_extraction
        if not ext_model:
            ext_model = ClinicalExtraction(
                consultation_id=consultation.id,
                chief_complaint=extraction.chief_complaint,
                symptoms=extraction.symptoms,
                symptom_duration=extraction.symptom_duration,
                symptom_severity=extraction.symptom_severity,
                history_of_present_illness=extraction.history_of_present_illness,
                past_medical_history=extraction.past_medical_history,
                allergies=extraction.allergies,
                current_medications=extraction.current_medications,
                family_history=extraction.family_history,
                social_history=extraction.social_history,
                vitals=extraction.vitals,
                examination_findings=extraction.examination_findings,
                investigations_mentioned=extraction.investigations_mentioned,
                medications_mentioned=extraction.medications_mentioned,
                important_warnings=extraction.important_warnings,
                unanswered_questions=extraction.unanswered_questions,
                raw_ai_response=extraction.model_dump(),
            )
            db.add(ext_model)
        else:
            for k, v in extraction.model_dump().items():
                if hasattr(ext_model, k):
                    setattr(ext_model, k, v)

        # 4. Generate SOAP Note
        soap = await ai.generate_soap(extraction, patient_context)
        note_model = consultation.clinical_note
        if not note_model:
            note_model = ClinicalNote(
                consultation_id=consultation.id,
                subjective=soap.subjective,
                objective=soap.objective,
                assessment=soap.assessment,
                plan=soap.plan,
                is_ai_draft=True,
                disclaimer="AI GENERATED - REQUIRES DOCTOR REVIEW. NOT AN AUTONOMOUS CLINICAL RECORD.",
            )
            db.add(note_model)
        else:
            note_model.subjective = soap.subjective
            note_model.objective = soap.objective
            note_model.assessment = soap.assessment
            note_model.plan = soap.plan
            note_model.is_ai_draft = True

        # 5. Suggested Diagnoses
        diagnoses = await ai.suggest_diagnoses(extraction, rag_context)
        # Clear existing suggestions and populate fresh
        for old_d in consultation.diagnosis_suggestions:
            db.delete(old_d)

        diag_names = []
        for d in diagnoses.suggestions:
            diag_names.append(d.condition)
            diag_model = DiagnosisSuggestion(
                consultation_id=consultation.id,
                condition=d.condition,
                reason=d.reason,
                confidence=d.confidence,
                source=d.source or "Clinical Guideline RAG",
                status="SUGGESTED",
            )
            db.add(diag_model)

        # 6. Suggested Investigations
        investigations = await ai.suggest_investigations(extraction, diag_names, rag_context)
        for old_inv in consultation.investigation_suggestions:
            db.delete(old_inv)

        for inv in investigations.suggestions:
            inv_model = InvestigationSuggestion(
                consultation_id=consultation.id,
                name=inv.name,
                reason=inv.reason,
                source=inv.source or "Guideline Protocol",
                status="RECOMMENDED",
            )
            db.add(inv_model)

        # 7. Prescription Draft
        rx_draft = await ai.generate_prescription_draft(
            extraction, diag_names, patient.allergies or "No known drug allergies reported"
        )
        rx_model = consultation.prescription
        if not rx_model:
            rx_model = Prescription(
                consultation_id=consultation.id,
                doctor_id=consultation.doctor_id,
                status="DRAFT",
                general_instructions=rx_draft.general_instructions,
                disclaimer="AI-GENERATED PRESCRIPTION DRAFT. REQUIRES DOCTOR REVIEW & APPROVAL. DO NOT DISPENSE AUTOMATICALLY.",
            )
            db.add(rx_model)
            db.flush()
        else:
            rx_model.general_instructions = rx_draft.general_instructions
            rx_model.status = "DRAFT"
            for old_item in rx_model.items:
                db.delete(old_item)

        for item in rx_draft.items:
            p_item = PrescriptionItem(
                prescription_id=rx_model.id,
                medication_name=item.medication_name,
                strength=item.strength,
                dose=item.dose,
                route=item.route,
                frequency=item.frequency,
                duration=item.duration,
                instructions=item.instructions,
                is_approved=False,
            )
            db.add(p_item)

        # 8. Suggested ICD Codes
        icd_codes = await ai.suggest_icd_codes(diag_names, extraction, rag_context)
        for old_icd in consultation.icd_suggestions:
            db.delete(old_icd)

        for icd in icd_codes.suggestions:
            icd_model = ICDSuggestion(
                consultation_id=consultation.id,
                code=icd.code,
                description=icd.description,
                reason=icd.reason,
                status="SUGGESTED",
            )
            db.add(icd_model)

        # 9. Bilingual Patient Care Guide (Malayalam + English)
        try:
            rx_items_dict = [
                {
                    "medication_name": item.medication_name,
                    "strength": item.strength,
                    "dose": item.dose,
                    "route": item.route,
                    "frequency": item.frequency,
                    "duration": item.duration,
                    "instructions": item.instructions,
                }
                for item in rx_draft.items
            ]
            guide = await ai.generate_patient_guide(
                patient_context=patient_context,
                diagnoses=diag_names,
                medications=rx_items_dict,
                doctor_notes=rx_draft.general_instructions,
            )
            consultation.patient_guide_json = guide.model_dump()
            en_text, ml_text = ConsultationService.format_guide_texts(guide)
            consultation.patient_guide_english = en_text
            consultation.patient_guide_malayalam = ml_text
        except Exception as e:
            logger.warning(f"Error generating patient guide in draft: {e}")

        # Transition status to PENDING_REVIEW
        consultation.status = "PENDING_REVIEW"
        consultation.ended_at = datetime.now(UTC)
        db.commit()
        db.refresh(consultation)

        AuditService.log(
            db,
            action="AI_DRAFT_GENERATED",
            actor_id=actor.id if actor else None,
            actor_name=actor.full_name if actor else "System",
            actor_role=actor.role if actor else "SYSTEM",
            target_entity="Consultation",
            target_id=consultation.consultation_id,
            details="Comprehensive AI clinical draft generated. Status transitioned to PENDING_REVIEW.",
        )

        return consultation

    @staticmethod
    def save_draft(
        db: Session, consultation_id: str, draft_in: SaveDraftRequest, doctor: User
    ) -> Consultation:
        consultation = ConsultationService.get_by_id_or_code(db, consultation_id)
        if not consultation:
            raise ValueError(f"Consultation {consultation_id} not found")

        # Update SOAP
        if draft_in.soap and consultation.clinical_note:
            if draft_in.soap.subjective is not None:
                consultation.clinical_note.subjective = draft_in.soap.subjective
            if draft_in.soap.objective is not None:
                consultation.clinical_note.objective = draft_in.soap.objective
            if draft_in.soap.assessment is not None:
                consultation.clinical_note.assessment = draft_in.soap.assessment
            if draft_in.soap.plan is not None:
                consultation.clinical_note.plan = draft_in.soap.plan
            if draft_in.soap.doctor_notes is not None:
                consultation.clinical_note.doctor_notes = draft_in.soap.doctor_notes

        # Update Diagnoses
        if draft_in.diagnoses is not None:
            for old_d in consultation.diagnosis_suggestions:
                db.delete(old_d)
            for d in draft_in.diagnoses:
                diag_model = DiagnosisSuggestion(
                    consultation_id=consultation.id,
                    condition=d.condition,
                    reason=d.reason,
                    confidence=d.confidence,
                    source=d.source,
                    status=d.status,
                )
                db.add(diag_model)

        # Update Investigations
        if draft_in.investigations is not None:
            for old_inv in consultation.investigation_suggestions:
                db.delete(old_inv)
            for inv in draft_in.investigations:
                inv_model = InvestigationSuggestion(
                    consultation_id=consultation.id,
                    name=inv.name,
                    reason=inv.reason,
                    source=inv.source,
                    status=inv.status,
                )
                db.add(inv_model)

        # Update Prescription
        if draft_in.prescription is not None and consultation.prescription:
            consultation.prescription.general_instructions = (
                draft_in.prescription.general_instructions
            )
            for old_item in consultation.prescription.items:
                db.delete(old_item)
            for item in draft_in.prescription.items:
                p_item = PrescriptionItem(
                    prescription_id=consultation.prescription.id,
                    medication_name=item.medication_name,
                    strength=item.strength,
                    dose=item.dose,
                    route=item.route,
                    frequency=item.frequency,
                    duration=item.duration,
                    instructions=item.instructions,
                    is_approved=item.is_approved,
                )
                db.add(p_item)

        # Update ICD
        if draft_in.icd_codes is not None:
            for old_icd in consultation.icd_suggestions:
                db.delete(old_icd)
            for icd in draft_in.icd_codes:
                icd_model = ICDSuggestion(
                    consultation_id=consultation.id,
                    code=icd.code,
                    description=icd.description,
                    reason=icd.reason,
                    status=icd.status,
                )
                db.add(icd_model)

        # Update Patient Care Guide if provided
        if draft_in.patient_guide_english is not None:
            consultation.patient_guide_english = draft_in.patient_guide_english
        if draft_in.patient_guide_malayalam is not None:
            consultation.patient_guide_malayalam = draft_in.patient_guide_malayalam
        if draft_in.patient_guide_json is not None:
            consultation.patient_guide_json = draft_in.patient_guide_json

        consultation.status = "PENDING_REVIEW"
        db.commit()
        db.refresh(consultation)

        AuditService.log(
            db,
            action="DOCTOR_EDITED_RECORD",
            actor_id=doctor.id,
            actor_name=doctor.full_name,
            actor_role=doctor.role,
            target_entity="Consultation",
            target_id=consultation.consultation_id,
            details=f"Doctor {doctor.full_name} edited and saved draft clinical documentation.",
        )

        return consultation

    @staticmethod
    def format_guide_texts(guide: PatientCareGuideSchema) -> tuple[str, str]:
        """Format structured guide schema into clean readable English and Malayalam texts."""
        en_lines = [
            f"=== {guide.title_en} ===",
            f"Diagnosis: {guide.diagnosis_summary_en}",
            "\nMedication Schedule:",
        ]
        for m in guide.medication_schedule:
            en_lines.append(f"• {m.medication}: {m.timing_en} ({m.purpose_en})")
            if m.special_notes:
                en_lines.append(f"  Note: {m.special_notes}")
        en_lines.append("\nDietary & Lifestyle Advice:")
        for d in guide.diet_and_lifestyle_en:
            en_lines.append(f"• {d}")
        en_lines.append("\nWarning Signs (Seek Urgent Care Immediately):")
        for w in guide.warning_signs_en:
            en_lines.append(f"⚠ {w}")
        en_lines.append(f"\nFollow-up: {guide.follow_up_en}")

        ml_lines = [
            f"=== {guide.title_ml} ===",
            f"രോഗ വിവരണം: {guide.diagnosis_summary_ml}",
            "\nമരുന്ന് കഴിക്കേണ്ട വിധം:",
        ]
        for m in guide.medication_schedule:
            ml_lines.append(f"• {m.medication}: {m.timing_ml} ({m.purpose_ml})")
            if m.special_notes:
                ml_lines.append(f"  പ്രത്യേക ശ്രദ്ധ: {m.special_notes}")
        ml_lines.append("\nഭക്ഷണവും ജീവിതശൈലി നിർദ്ദേശങ്ങളും:")
        for d in guide.diet_and_lifestyle_ml:
            ml_lines.append(f"• {d}")
        ml_lines.append("\nഅടിയന്തരമായി ഡോക്ടറെ കാണേണ്ട ലക്ഷണങ്ങൾ:")
        for w in guide.warning_signs_ml:
            ml_lines.append(f"⚠ {w}")
        ml_lines.append(f"\nതുടർപരിശോധന: {guide.follow_up_ml}")

        return "\n".join(en_lines), "\n".join(ml_lines)

    @staticmethod
    async def regenerate_patient_guide_for_consultation(
        db: Session, consultation_id: str, actor: User
    ) -> Consultation:
        consultation = ConsultationService.get_by_id_or_code(db, consultation_id)
        if not consultation:
            raise ValueError(f"Consultation {consultation_id} not found")

        ai = get_ai_provider()
        patient = consultation.patient
        patient_context = {
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "allergies": patient.allergies,
            "existing_conditions": patient.existing_conditions,
        }
        diagnoses = [d.condition for d in consultation.diagnosis_suggestions]
        rx_items = []
        if consultation.prescription:
            rx_items = [
                {
                    "medication_name": item.medication_name,
                    "strength": item.strength,
                    "dose": item.dose,
                    "route": item.route,
                    "frequency": item.frequency,
                    "duration": item.duration,
                    "instructions": item.instructions,
                }
                for item in consultation.prescription.items
            ]

        doc_notes = (
            consultation.prescription.general_instructions
            if consultation.prescription
            else None
        )
        guide = await ai.generate_patient_guide(
            patient_context=patient_context,
            diagnoses=diagnoses,
            medications=rx_items,
            doctor_notes=doc_notes,
        )
        consultation.patient_guide_json = guide.model_dump()
        en_text, ml_text = ConsultationService.format_guide_texts(guide)
        consultation.patient_guide_english = en_text
        consultation.patient_guide_malayalam = ml_text

        db.commit()
        db.refresh(consultation)

        AuditService.log(
            db,
            action="PATIENT_GUIDE_REGENERATED",
            actor_id=actor.id,
            actor_name=actor.full_name,
            actor_role=actor.role,
            target_entity="Consultation",
            target_id=consultation.consultation_id,
            details=f"Doctor {actor.full_name} regenerated Bilingual Patient Care Guide.",
        )
        return consultation

    @staticmethod
    def update_patient_guide(
        db: Session,
        consultation_id: str,
        guide_english: str | None,
        guide_malayalam: str | None,
        guide_json: dict | None,
        actor: User,
    ) -> Consultation:
        consultation = ConsultationService.get_by_id_or_code(db, consultation_id)
        if not consultation:
            raise ValueError(f"Consultation {consultation_id} not found")

        if guide_english is not None:
            consultation.patient_guide_english = guide_english
        if guide_malayalam is not None:
            consultation.patient_guide_malayalam = guide_malayalam
        if guide_json is not None:
            consultation.patient_guide_json = guide_json

        db.commit()
        db.refresh(consultation)

        AuditService.log(
            db,
            action="PATIENT_GUIDE_UPDATED",
            actor_id=actor.id,
            actor_name=actor.full_name,
            actor_role=actor.role,
            target_entity="Consultation",
            target_id=consultation.consultation_id,
            details=f"Doctor {actor.full_name} updated Bilingual Patient Care Guide.",
        )
        return consultation


    @staticmethod
    def approve_consultation(
        db: Session, consultation_id: str, approval_in: ApprovalRequest, doctor: User
    ) -> Approval:
        consultation = ConsultationService.get_by_id_or_code(db, consultation_id)
        if not consultation:
            raise ValueError(f"Consultation {consultation_id} not found")

        if consultation.status == "APPROVED":
            raise ValueError("This consultation record has already been approved.")

        doctor_profile = doctor.doctor_profile
        doc_license = doctor_profile.license_number if doctor_profile else "DOC-LIC-VERIFIED"

        # Generate cryptographic signature hash
        sign_payload = f"{consultation.consultation_id}:{doctor.id}:{doc_license}:{datetime.now(UTC).isoformat()}"
        signature_hash = hashlib.sha256(sign_payload.encode()).hexdigest()

        # Mark clinical notes as finalized
        if consultation.clinical_note:
            consultation.clinical_note.is_ai_draft = False
            consultation.clinical_note.disclaimer = (
                "APPROVED CLINICAL RECORD - SIGNED BY ATTENDING PHYSICIAN"
            )
            if approval_in.doctor_notes:
                consultation.clinical_note.doctor_notes = approval_in.doctor_notes

        # Finalize prescription
        if consultation.prescription:
            consultation.prescription.status = "APPROVED"
            consultation.prescription.doctor_signature = signature_hash
            consultation.prescription.disclaimer = (
                "AUTHORIZED CLINICAL PRESCRIPTION - VERIFIED & SIGNED BY DOCTOR"
            )
            for item in consultation.prescription.items:
                item.is_approved = True

        # Transition diagnoses and investigations to accepted/ordered
        for d in consultation.diagnosis_suggestions:
            if d.status == "SUGGESTED":
                d.status = "ACCEPTED"

        for inv in consultation.investigation_suggestions:
            if inv.status == "RECOMMENDED":
                inv.status = "ORDERED"

        for icd in consultation.icd_suggestions:
            if icd.status == "SUGGESTED":
                icd.status = "ACCEPTED"

        # Create Approval record
        approval = Approval(
            consultation_id=consultation.id,
            doctor_id=doctor_profile.id if doctor_profile else None,
            doctor_name=doctor.full_name,
            doctor_license=doc_license,
            doctor_notes=approval_in.doctor_notes,
            signature_hash=signature_hash,
            approved_at=datetime.now(UTC),
        )
        db.add(approval)

        consultation.status = "APPROVED"
        db.commit()
        db.refresh(approval)

        AuditService.log(
            db,
            action="DOCTOR_APPROVED",
            actor_id=doctor.id,
            actor_name=doctor.full_name,
            actor_role=doctor.role,
            target_entity="Consultation",
            target_id=consultation.consultation_id,
            details=f"Doctor {doctor.full_name} explicitly reviewed and approved clinical record. Signature Hash: {signature_hash[:16]}...",
        )

        AuditService.log(
            db,
            action="HOSPITAL_RECORD_CREATED",
            actor_id=doctor.id,
            actor_name=doctor.full_name,
            actor_role=doctor.role,
            target_entity="HospitalRecord",
            target_id=consultation.consultation_id,
            details=f"Permanent approved hospital electronic health record created for Patient {consultation.patient.name}",
        )

        return approval

    @staticmethod
    def reject_consultation(
        db: Session, consultation_id: str, reject_in: RejectionRequest, doctor: User
    ) -> Consultation:
        consultation = ConsultationService.get_by_id_or_code(db, consultation_id)
        if not consultation:
            raise ValueError(f"Consultation {consultation_id} not found")

        consultation.status = "REJECTED"
        db.commit()
        db.refresh(consultation)

        AuditService.log(
            db,
            action="DOCTOR_REJECTED",
            actor_id=doctor.id,
            actor_name=doctor.full_name,
            actor_role=doctor.role,
            target_entity="Consultation",
            target_id=consultation.consultation_id,
            details=f"Doctor {doctor.full_name} rejected AI clinical draft. Reason: {reject_in.reason}",
        )

        return consultation
