import React, { useEffect, useState } from 'react';
import { PatientHistoryResponse } from '@/types';
import { patientsApi } from '@/api/client';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Calendar, User, Stethoscope, Pill, CheckCircle2, Clock } from 'lucide-react';

interface PatientHistoryModalProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({
  patientId,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<PatientHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patientId && isOpen) {
      setLoading(true);
      patientsApi
        .getHistory(patientId)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [patientId, isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? `${data.patient.name} (${data.patient.patient_id})` : 'Medical Record History'}
      description="Permanent electronic health record timeline and approved consultations"
      maxWidth="lg"
    >
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading verified medical records...
        </div>
      ) : !data || data.consultations.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No recorded consultations found for this patient.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Patient Quick Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800">
                {data.patient.age} yrs • {data.patient.gender} • Blood Group: {data.patient.blood_group || 'N/A'}
              </span>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Allergies: <span className="font-medium text-amber-700">{data.patient.allergies || 'NKDA'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Visits</span>
              <span className="text-sm font-bold text-slate-800">{data.consultations.length}</span>
            </div>
          </div>

          {/* Consultation Timeline */}
          <div className="space-y-3">
            {data.consultations.map((c) => {
              const isApproved = c.is_approved || c.status === 'APPROVED';
              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border text-xs transition-all ${
                    isApproved
                      ? 'bg-white border-emerald-200/90 shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {c.consultation_id}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(c.started_at).toLocaleDateString()}
                        </span>
                        {c.doctor_name && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Stethoscope className="w-3 h-3" />
                            {c.doctor_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {isApproved && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Signed Record
                      </span>
                    )}
                  </div>

                  {/* Chief complaint & diagnoses */}
                  {c.chief_complaint && (
                    <div className="mt-2 text-slate-700">
                      <strong className="text-slate-900">Reason for Visit:</strong> {c.chief_complaint}
                    </div>
                  )}

                  {c.diagnoses && c.diagnoses.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.diagnoses.map((d, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Prescribed medications */}
                  {c.medications && c.medications.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-slate-600 text-[11px]">
                      <Pill className="w-3 h-3 text-brand-600 shrink-0" />
                      <span>Rx: {c.medications.join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
};
