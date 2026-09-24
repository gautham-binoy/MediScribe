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
} from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { PatientCard } from '@/components/review/PatientCard';
import { OriginalTranscriptCard } from '@/components/review/OriginalTranscriptCard';
import { ExtractionReview } from '@/components/review/ExtractionReview';
import { SoapEditor } from '@/components/review/SoapEditor';
import { DiagnosisReview } from '@/components/review/DiagnosisReview';
import { InvestigationReview } from '@/components/review/InvestigationReview';
import { PrescriptionReview } from '@/components/review/PrescriptionReview';
import { IcdReview } from '@/components/review/IcdReview';
import { RagSourcesCard } from '@/components/review/RagSourcesCard';
import { ApprovalModal } from '@/components/review/ApprovalModal';
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
} from 'lucide-react';

export const ReviewConsultationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'soap' | 'rx' | 'diagnoses' | 'extraction' | 'transcript'>('soap');

  // Editable local state
  const [extraction, setExtraction] = useState<ClinicalExtraction | null>(null);
  const [soap, setSoap] = useState<SOAPNote | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisSuggestion[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationSuggestion[]>([]);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [icdCodes, setIcdCodes] = useState<ICDSuggestion[]>([]);

  // Modals
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

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
      });
      success('Draft Saved', 'All clinical edits saved successfully.');
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
    return <div className="py-12 text-center text-xs text-slate-400">Loading doctor review workspace...</div>;
  }

  const patient = consultation.patient;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-sm text-slate-900">
                {consultation.consultation_id}
              </span>
              <StatusBadge status={consultation.status} />
              <span className="text-xs text-slate-400 font-medium">
                Encounter Date: {new Date(consultation.started_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Physician Review & Clinical Sign-off
            </h1>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {!isApproved && !isRejected && (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={handleSaveDraft}
                isLoading={isSaving}
                icon={<Save className="w-4 h-4" />}
              >
                Save Draft
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={handleRegenerate}
                isLoading={isRegenerating}
                icon={<RotateCw className="w-4 h-4" />}
                title="Regenerate draft with AI"
              >
                Regenerate
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => setShowRejectModal(true)}
                icon={<XCircle className="w-4 h-4 text-rose-500" />}
                className="text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                Reject
              </Button>

              <Button
                variant="success"
                size="md"
                onClick={() => setShowApprovalModal(true)}
                icon={<FileSignature className="w-4 h-4" />}
                className="shadow-sm shadow-emerald-500/20 font-bold"
              >
                Approve Clinical Record
              </Button>
            </>
          )}

          {isApproved && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>RECORD DIGITALLY SIGNED & VERIFIED</span>
            </div>
          )}
        </div>
      </div>

      {/* Patient Demographic Card */}
      {patient && <PatientCard patient={patient} />}

      {/* Approved Signature Verification Banner (if approved) */}
      {isApproved && consultation.approval && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-emerald-900 text-sm">
                Certified Clinical Record Signed by {consultation.approval.doctor_name}
              </div>
              <div className="text-emerald-700 mt-0.5">
                License: {consultation.approval.doctor_license} • Approved At:{' '}
                {new Date(consultation.approval.approved_at).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-right font-mono text-[10px] text-emerald-800 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200">
            <div>Approval Record Hash:</div>
            <div className="font-bold">{consultation.approval.signature_hash.substring(0, 32)}...</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs for Review Subsections */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('soap')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'soap' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          SOAP Progress Note
        </button>

        <button
          onClick={() => setActiveTab('rx')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'rx' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Prescription Draft ({prescription?.items?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('diagnoses')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'diagnoses' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Diagnoses & Labs
        </button>

        <button
          onClick={() => setActiveTab('extraction')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'extraction' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Structured Extraction
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'transcript' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Verbatim Dialogue (മലയാളം/Eng)
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* SOAP Tab */}
        {activeTab === 'soap' && soap && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SoapEditor
                soap={soap}
                onChange={(updated) => setSoap({ ...soap, ...updated })}
                readOnly={isApproved}
              />
            </div>
            <div className="space-y-6">
              <RagSourcesCard sources={consultation.rag_sources} />
              {icdCodes.length > 0 && (
                <IcdReview
                  icdCodes={icdCodes}
                  onChange={setIcdCodes}
                  readOnly={isApproved}
                />
              )}
            </div>
          </div>
        )}

        {/* Prescription Tab */}
        {activeTab === 'rx' && prescription && (
          <div className="space-y-6">
            <PrescriptionReview
              prescription={prescription}
              patientAllergies={patient?.allergies}
              onChange={(updated) => setPrescription({ ...prescription, ...updated })}
              readOnly={isApproved}
            />
          </div>
        )}

        {/* Diagnoses & Investigations Tab */}
        {activeTab === 'diagnoses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DiagnosisReview
              diagnoses={diagnoses}
              onChange={setDiagnoses}
              readOnly={isApproved}
            />
            <div className="space-y-6">
              <InvestigationReview
                investigations={investigations}
                onChange={setInvestigations}
                readOnly={isApproved}
              />
              <IcdReview
                icdCodes={icdCodes}
                onChange={setIcdCodes}
                readOnly={isApproved}
              />
            </div>
          </div>
        )}

        {/* Structured Extraction Tab */}
        {activeTab === 'extraction' && extraction && (
          <ExtractionReview
            extraction={extraction}
            onChange={(updated) => setExtraction({ ...extraction, ...updated })}
            readOnly={isApproved}
          />
        )}

        {/* Transcript Tab */}
        {activeTab === 'transcript' && consultation.transcript && (
          <OriginalTranscriptCard
            originalTranscript={consultation.transcript.original_transcript}
            normalizedText={consultation.transcript.normalized_clinical_text}
            clinicalSummary={consultation.transcript.clinical_summary}
            detectedLanguage={consultation.detected_language}
          />
        )}
      </div>

      {/* Confirmation Approval Modal */}
      {patient && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onConfirm={handleApprove}
          patientName={patient.name}
          consultationCode={consultation.consultation_id}
        />
      )}

      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject AI Clinical Draft"
        description="Provide a medical justification for rejecting the consultation record."
        maxWidth="md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Rejection Reason
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Dialogue audio inaudible, mismatched patient identity, incorrect clinical history..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button size="md" variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              size="md"
              variant="danger"
              disabled={!rejectReason.trim()}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
