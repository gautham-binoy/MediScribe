import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { consultationsApi } from '@/api/client';
import {
  Consultation,
  ClinicalExtraction,
  SOAPNote,
  DiagnosisSuggestion,
  InvestigationSuggestion,
  Prescription,
  ICDSuggestion,
  SafetyAlert,
  PatientCareGuide,
} from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CompactPatientStrip } from '@/components/review/CompactPatientStrip';
import { OriginalTranscriptCard } from '@/components/review/OriginalTranscriptCard';
import { ExtractionReview } from '@/components/review/ExtractionReview';
import { SoapEditor } from '@/components/review/SoapEditor';
import { DiagnosisReview } from '@/components/review/DiagnosisReview';
import { InvestigationReview } from '@/components/review/InvestigationReview';
import { PrescriptionReview } from '@/components/review/PrescriptionReview';
import { IcdReview } from '@/components/review/IcdReview';
import { RagSourcesCard } from '@/components/review/RagSourcesCard';
import { ApprovalModal } from '@/components/review/ApprovalModal';
import { BilingualPatientGuide } from '@/components/review/BilingualPatientGuide';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  CheckCircle2,
  FileCheck2,
  Save,
  RotateCw,
  XCircle,
  FileSignature,
  ArrowLeft,
  ShieldCheck,
  Award,
  FileDown,
  Languages,
  AlertCircle,
  Sparkles,
  MessageSquare,
  FileSearch,
  Check,
  ChevronRight,
  ClipboardList,
  Pill,
  Printer,
} from 'lucide-react';

export const ReviewConsultationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  // 3-Stage Clean Workflow State
  const [workflowStep, setWorkflowStep] = useState<'notes' | 'treatment' | 'discharge'>('notes');

  // Editable local state
  const [extraction, setExtraction] = useState<ClinicalExtraction | null>(null);
  const [soap, setSoap] = useState<SOAPNote | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisSuggestion[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationSuggestion[]>([]);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [icdCodes, setIcdCodes] = useState<ICDSuggestion[]>([]);

  // Clinical Safety & Bilingual Guide states
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [patientGuideJson, setPatientGuideJson] = useState<PatientCareGuide | undefined>(undefined);
  const [patientGuideEnglish, setPatientGuideEnglish] = useState<string | undefined>(undefined);
  const [patientGuideMalayalam, setPatientGuideMalayalam] = useState<string | undefined>(undefined);

  // Modals & Drawers
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDialogueDrawer, setShowDialogueDrawer] = useState(false);
  const [showExtractionDrawer, setShowExtractionDrawer] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Action loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isRegeneratingGuide, setIsRegeneratingGuide] = useState(false);

  const fetchConsultation = () => {
    if (!id) return;
    setLoading(true);
    consultationsApi
      .getById(id)
      .then((c) => {
        setConsultation(c);
        if (c.clinical_extraction) setExtraction(c.clinical_extraction);
        if (c.clinical_note) setSoap(c.clinical_note);
        if (c.diagnosis_suggestions) setDiagnoses(c.diagnosis_suggestions);
        if (c.investigation_suggestions) setInvestigations(c.investigation_suggestions);
        if (c.prescription) setPrescription(c.prescription);
        if (c.icd_suggestions) setIcdCodes(c.icd_suggestions);
        if (c.safety_alerts) setSafetyAlerts(c.safety_alerts);
        if (c.patient_guide_json) setPatientGuideJson(c.patient_guide_json);
        if (c.patient_guide_english) setPatientGuideEnglish(c.patient_guide_english);
        if (c.patient_guide_malayalam) setPatientGuideMalayalam(c.patient_guide_malayalam);
      })
      .catch((err) => {
        toastError('Failed to load review', err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConsultation();
  }, [id]);

  const isApproved = consultation?.status === 'APPROVED';
  const isRejected = consultation?.status === 'REJECTED';

  // 1-Click Official Prescription PDF Download
  const handleDownloadPdf = async () => {
    if (!id || !consultation) return;
    setIsDownloadingPdf(true);
    info('Generating Prescription PDF', 'Rendering authentic hospital letterhead, Rx table & Malayalam script...');
    try {
      await consultationsApi.downloadPrescriptionPdf(id, consultation.consultation_id);
      success('PDF Downloaded', `Prescription_${consultation.consultation_id}.pdf downloaded successfully.`);
    } catch (err: any) {
      toastError('Download Failed', err.message || 'Could not download prescription PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Live Drug-Allergy & Drug-Drug Conflict Checker
  const handleCheckSafety = async () => {
    if (!id) return;
    setIsCheckingSafety(true);
    try {
      const items = prescription?.items || [];
      const alerts = await consultationsApi.checkSafety(id, items);
      setSafetyAlerts(alerts);
      const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
      const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;

      if (criticalCount > 0) {
        toastError('Critical Contraindication Flagged', `${criticalCount} high-risk allergy/drug conflict(s) detected.`);
      } else if (warningCount > 0) {
        info('Clinical Caution', `${warningCount} caution interaction(s) found in prescription.`);
      } else {
        success('Safety Verified', 'All prescribed medications checked clean against patient profile.');
      }
    } catch (err: any) {
      toastError('Safety Check Failed', err.message);
    } finally {
      setIsCheckingSafety(false);
    }
  };

  // Regenerate Bilingual Patient Care Guide
  const handleRegeneratePatientGuide = async () => {
    if (!id) return;
    setIsRegeneratingGuide(true);
    info('Synthesizing Patient Guide', 'Generating dual-language advice (English + മലയാളം)...');
    try {
      const updated = await consultationsApi.regeneratePatientGuide(id);
      setConsultation(updated);
      if (updated.patient_guide_json) setPatientGuideJson(updated.patient_guide_json);
      if (updated.patient_guide_english) setPatientGuideEnglish(updated.patient_guide_english);
      if (updated.patient_guide_malayalam) setPatientGuideMalayalam(updated.patient_guide_malayalam);
      success('Guide Updated', 'Bilingual Patient Care Guide successfully synthesized.');
    } catch (err: any) {
      toastError('Guide Update Failed', err.message);
    } finally {
      setIsRegeneratingGuide(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await consultationsApi.saveDraft(id, {
        soap: soap ? {
          subjective: soap.subjective,
          objective: soap.objective,
          assessment: soap.assessment,
          plan: soap.plan,
          doctor_notes: soap.doctor_notes,
        } : undefined,
        diagnoses,
        investigations,
        prescription: prescription ? {
          general_instructions: prescription.general_instructions,
          items: prescription.items,
        } : undefined,
        icd_codes: icdCodes,
        patient_guide_english: patientGuideEnglish,
        patient_guide_malayalam: patientGuideMalayalam,
        patient_guide_json: patientGuideJson,
      });
      success('Draft Saved', 'All clinical edits & patient guide saved successfully.');
    } catch (err: any) {
      toastError('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Regenerate with AI
  const handleRegenerate = async () => {
    if (!id) return;
    setIsRegenerating(true);
    info('Regenerating AI Drafts', 'Rerunning clinical extraction and guideline retrieval...');
    try {
      await consultationsApi.generateDrafts(id);
      fetchConsultation();
      success('Regeneration Complete', 'Clinical fields updated with refreshed AI suggestions.');
    } catch (err: any) {
      toastError('Regeneration Failed', err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Approve Record
  const handleApprove = async (doctorNotes: string) => {
    if (!id) return;
    try {
      const appr = await consultationsApi.approve(id, { doctor_notes: doctorNotes });
      success('Clinical Record Approved', 'Digitally signed and committed to hospital EHR registry.');
      fetchConsultation();
    } catch (err: any) {
      toastError('Approval Failed', err.message);
    }
  };

  // Reject Record
  const handleReject = async () => {
    if (!id || !rejectReason.trim()) return;
    try {
      await consultationsApi.reject(id, { reason: rejectReason });
      success('Draft Rejected', 'Consultation status marked as REJECTED.');
      setShowRejectModal(false);
      fetchConsultation();
    } catch (err: any) {
      toastError('Rejection Failed', err.message);
    }
  };

  if (loading || !consultation) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-500 shadow-xs">
          <RotateCw className="w-4 h-4 animate-spin text-brand-600" />
          Loading doctor review workspace...
        </div>
      </div>
    );
  }

  const patient = consultation.patient;
  const criticalConflictCount = safetyAlerts.filter((a) => a.severity === 'CRITICAL').length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. TOP HEADER & PRIMARY ACTION TOOLBAR */}
      <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back Button & Meta */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900">
                {consultation.consultation_id}
              </span>
              <StatusBadge status={consultation.status} />
              <span className="text-xs text-slate-400 hidden sm:inline">
                • {new Date(consultation.started_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Encounter Review & Clinical Sign-off
            </p>
          </div>
        </div>

        {/* Right: Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Dialogue Reference Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDialogueDrawer(true)}
            icon={<MessageSquare className="w-3.5 h-3.5 text-slate-500" />}
            title="Inspect verbatim Malayalam & English conversation"
            className="text-xs"
          >
            <span className="hidden sm:inline">View</span> Dialogue
          </Button>

          {/* Quick Extracted Facts Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExtractionDrawer(true)}
            icon={<FileSearch className="w-3.5 h-3.5 text-slate-500" />}
            title="Inspect structured clinical extraction"
            className="text-xs"
          >
            <span className="hidden sm:inline">Extracted</span> Facts
          </Button>

          {/* Always Available 1-Click Prescription PDF Download */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isDownloadingPdf}
            icon={<FileDown className="w-3.5 h-3.5 text-brand-600" />}
            className="border-brand-200 hover:bg-brand-50 text-brand-900 font-semibold shadow-2xs text-xs"
            title="Download official hospital prescription PDF"
          >
            Rx PDF
          </Button>

          {!isApproved && !isRejected && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                isLoading={isSaving}
                icon={<Save className="w-3.5 h-3.5 text-slate-500" />}
                className="text-xs"
              >
                Save
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                isLoading={isRegenerating}
                icon={<RotateCw className="w-3.5 h-3.5 text-slate-500" />}
                title="Regenerate clinical draft with AI"
                className="text-xs"
              >
                Regen
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(true)}
                icon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
                className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs"
              >
                Reject
              </Button>

              <Button
                variant="success"
                size="sm"
                onClick={() => setShowApprovalModal(true)}
                icon={<FileSignature className="w-3.5 h-3.5" />}
                className="shadow-sm shadow-emerald-500/20 font-bold text-xs"
              >
                Approve Record
              </Button>
            </>
          )}

          {isApproved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>DIGITALLY SIGNED</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. COMPACT PATIENT STRIP (Saves 100+ px vertical space) */}
      {patient && (
        <CompactPatientStrip
          patient={patient}
          vitals={extraction?.vitals}
        />
      )}

      {/* Approved Digital Verification Banner (if approved) */}
      {isApproved && consultation.approval && (
        <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-950">
                Certified Clinical Record Signed by {consultation.approval.doctor_name} ({consultation.approval.doctor_license})
              </span>
              <span className="text-emerald-700 block text-[11px]">
                Approved: {new Date(consultation.approval.approved_at).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="text-right font-mono text-[10px] text-emerald-800 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
            Hash: <strong>{consultation.approval.signature_hash.substring(0, 24)}...</strong>
          </div>
        </div>
      )}

      {/* 3. 3-STAGE CLEAR WORKFLOW STEPPER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-1.5 bg-slate-200/70 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Step 1: Notes & Diagnoses */}
        <button
          onClick={() => setWorkflowStep('notes')}
          className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
            workflowStep === 'notes'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              workflowStep === 'notes' ? 'bg-brand-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
            }`}
          >
            1
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">Clinical Note & Diagnosis</div>
            <div className="text-[11px] text-slate-500 truncate">SOAP progress note & ICD-10 codes</div>
          </div>
        </button>

        {/* Step 2: Treatment & Safety */}
        <button
          onClick={() => setWorkflowStep('treatment')}
          className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 relative ${
            workflowStep === 'treatment'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              workflowStep === 'treatment' ? 'bg-brand-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
            }`}
          >
            2
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold truncate flex items-center justify-between">
              <span>Prescription & Safety Shield</span>
              {criticalConflictCount > 0 && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                  {criticalConflictCount} Alert
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Medications, live conflict checks, labs</div>
          </div>
        </button>

        {/* Step 3: Discharge & Patient Guide */}
        <button
          onClick={() => setWorkflowStep('discharge')}
          className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
            workflowStep === 'discharge'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              workflowStep === 'discharge' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
            }`}
          >
            3
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate flex items-center gap-1.5">
              <span>Patient Guide & Discharge</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800">
                മലയാളം
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">Bilingual patient guide & 1-Click PDF</div>
          </div>
        </button>
      </div>

      {/* 4. FOCUSED STEP VIEWS (Clean & Uncluttered) */}

      {/* STEP 1: CLINICAL NOTE & DIAGNOSIS */}
      {workflowStep === 'notes' && soap && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
          {/* Main Column: SOAP Progress Note (7 of 12 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <SoapEditor
              soap={soap}
              onChange={(updated) => setSoap({ ...soap, ...updated })}
              readOnly={isApproved}
            />

            {/* Step 1 Completion Navigation Footer */}
            <div className="flex justify-end p-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => setWorkflowStep('treatment')}
                icon={<ChevronRight className="w-4 h-4" />}
                className="shadow-xs"
              >
                Proceed to Prescription & Safety Shield
              </Button>
            </div>
          </div>

          {/* Right Column: Diagnostic Classifications & Guidelines (5 of 12 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <DiagnosisReview
              diagnoses={diagnoses}
              onChange={setDiagnoses}
              readOnly={isApproved}
            />

            {icdCodes.length > 0 && (
              <IcdReview
                icdCodes={icdCodes}
                onChange={setIcdCodes}
                readOnly={isApproved}
              />
            )}

            <RagSourcesCard sources={consultation.rag_sources} />
          </div>
        </div>
      )}

      {/* STEP 2: PRESCRIPTION & SAFETY SHIELD */}
      {workflowStep === 'treatment' && prescription && (
        <div className="space-y-5 animate-fade-in">
          <PrescriptionReview
            prescription={prescription}
            patientAllergies={patient?.allergies}
            safetyAlerts={safetyAlerts}
            onCheckSafety={handleCheckSafety}
            isCheckingSafety={isCheckingSafety}
            onDownloadPdf={handleDownloadPdf}
            onChange={(updated) => setPrescription({ ...prescription, ...updated })}
            readOnly={isApproved}
          />

          <InvestigationReview
            investigations={investigations}
            onChange={setInvestigations}
            readOnly={isApproved}
          />

          {/* Step 2 Completion Navigation Footer */}
          <div className="flex justify-between items-center p-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <Button
              variant="outline"
              size="md"
              onClick={() => setWorkflowStep('notes')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Clinical Note
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setWorkflowStep('discharge')}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Proceed to Bilingual Patient Guide & PDF
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: BILINGUAL PATIENT GUIDE & DISCHARGE */}
      {workflowStep === 'discharge' && (
        <div className="space-y-5 animate-fade-in">
          <BilingualPatientGuide
            guideJson={patientGuideJson}
            guideEnglish={patientGuideEnglish}
            guideMalayalam={patientGuideMalayalam}
            onRegenerate={handleRegeneratePatientGuide}
            onDownloadPdf={handleDownloadPdf}
            isRegenerating={isRegeneratingGuide}
          />

          {/* Official Prescription PDF Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold shrink-0">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Official Hospital Prescription Document (PDF)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formatted with hospital letterhead, NABH credentials, vitals, Rx orders, and native Malayalam after-care instructions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={handleDownloadPdf}
                isLoading={isDownloadingPdf}
                icon={<FileDown className="w-4 h-4 text-brand-600" />}
                className="font-bold border-brand-200 text-brand-950"
              >
                Download Official PDF
              </Button>

              {!isApproved && (
                <Button
                  variant="success"
                  size="md"
                  onClick={() => setShowApprovalModal(true)}
                  icon={<FileSignature className="w-4 h-4" />}
                  className="font-bold shadow-xs"
                >
                  Approve & Commit EHR
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Back */}
          <div className="flex justify-start p-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setWorkflowStep('treatment')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Prescription & Safety Shield
            </Button>
          </div>
        </div>
      )}

      {/* 5. SLIDE-OVER MODALS FOR VERBATIM DIALOGUE & CLINICAL EXTRACTIONS */}
      {/* Modal: Verbatim Conversation Dialogue */}
      <Modal
        isOpen={showDialogueDrawer}
        onClose={() => setShowDialogueDrawer(false)}
        title="Verbatim Encounter Dialogue (മലയാളം + English)"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Recorded audio transcript with speaker diarization and normalized clinical preview.
          </p>
          {consultation.transcript ? (
            <OriginalTranscriptCard
              originalTranscript={consultation.transcript.original_transcript}
              normalizedText={consultation.transcript.normalized_clinical_text}
              clinicalSummary={consultation.transcript.clinical_summary}
              detectedLanguage={consultation.detected_language}
            />
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No transcript available for this consultation.
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Structured Entity Extraction */}
      <Modal
        isOpen={showExtractionDrawer}
        onClose={() => setShowExtractionDrawer(false)}
        title="Structured Clinical Entities"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            AI-extracted clinical entities, symptoms, durations, and reported warnings.
          </p>
          {extraction ? (
            <ExtractionReview
              extraction={extraction}
              onChange={(updated) => setExtraction({ ...extraction, ...updated })}
              readOnly={isApproved}
            />
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No clinical entities extracted yet.
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Approval Modal */}
      {patient && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onConfirm={handleApprove}
          patientName={patient.name}
          consultationCode={consultation.consultation_id || 'CON-DEMO'}
        />
      )}

      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject AI Clinical Draft"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Specify the reason for rejecting this AI draft. This event will be permanently recorded in the hospital audit trail.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Clinical inaccuracies, missing critical history, etc."
            className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
