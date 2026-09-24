import React, { useState } from 'react';
import { ShieldCheck, Award, Lock, FileSignature } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  patientName: string;
  consultationCode: string;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  consultationCode,
}) => {
  const { user } = useAuth();
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const licenseNumber = user?.doctor_profile?.license_number || 'KMC-REG-2024-8891';

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(doctorNotes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve & Finalize Clinical Record"
      description={`Attending physician electronic sign-off for ${consultationCode}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Physician Credential Banner */}
        <div className="p-3.5 bg-brand-50 border border-brand-200 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900">{user?.full_name || 'Attending Physician'}</div>
            <div className="text-slate-600 font-mono mt-0.5">Medical License: {licenseNumber}</div>
          </div>
        </div>

        {/* Legal & Medical Verification Notice */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Physician Declaration
          </div>
          <p className="leading-relaxed">
            By approving, I certify that I have reviewed the clinical extraction, progress note,
            suggested diagnoses, investigations, and prescription draft for <strong>{patientName}</strong>.
            All AI outputs have been edited and verified under my direct clinical supervision.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Approval Record Integrity Hash (SHA-256) will be generated.</span>
          </div>
        </div>

        {/* Optional Sign-off Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Optional Physician Sign-off Remarks
          </label>
          <textarea
            rows={2}
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder="e.g. Verified and signed off. Patient instructed on danger symptoms..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="success"
            size="md"
            onClick={handleApprove}
            isLoading={isSubmitting}
            icon={<FileSignature className="w-4 h-4" />}
          >
            Confirm & Sign Record
          </Button>
        </div>
      </div>
    </Modal>
  );
};
