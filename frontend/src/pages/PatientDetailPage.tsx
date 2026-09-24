import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientsApi } from '@/api/client';
import { PatientHistoryResponse } from '@/types';
import {
  User,
  Phone,
  Droplet,
  Calendar,
  AlertTriangle,
  Stethoscope,
  Pill,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<PatientHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      patientsApi
        .getHistory(id)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading patient profile...</div>;
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        Patient record not found.{' '}
        <button onClick={() => navigate('/patients')} className="text-brand-600 underline">
          Back to directory
        </button>
      </div>
    );
  }

  const { patient, consultations } = data;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patients Directory
        </button>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate(`/consultations/new?patient_id=${patient.patient_id}`)}
          icon={<Stethoscope className="w-4 h-4" />}
        >
          Start Consultation with {patient.name}
        </Button>
      </div>

      {/* Patient Header Card */}
      <Card className="bg-gradient-to-r from-slate-900 to-navy-900 text-white border-slate-800 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-xl shrink-0">
                {patient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">{patient.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-md bg-brand-500/20 border border-brand-500/30 font-mono text-xs font-semibold text-brand-300">
                    {patient.patient_id}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                  <span>{patient.age} yrs old</span>
                  <span>•</span>
                  <span>{patient.gender}</span>
                  <span>•</span>
                  <span>DOB: {patient.dob}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {patient.phone}
                  </span>
                  {patient.blood_group && (
                    <>
                      <span>•</span>
                      <span className="text-rose-300 font-semibold">{patient.blood_group}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Highlights */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Allergies</span>
                <span className="font-semibold text-amber-400 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  {patient.allergies || 'NKDA'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Chronic Conditions</span>
                <span className="font-medium text-slate-200 mt-0.5 block">{patient.existing_conditions || 'None'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Longitudinal Consultation History */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600" />
          Longitudinal Medical Encounters ({consultations.length})
        </h2>

        {consultations.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 text-xs">
            No consultations recorded yet for this patient. Click "Start Consultation" to initiate documentation.
          </Card>
        ) : (
          <div className="space-y-3">
            {consultations.map((c) => {
              const isApproved = c.is_approved || c.status === 'APPROVED';
              return (
                <Card
                  key={c.id}
                  className={`p-5 hover:border-slate-300 transition-all ${
                    isApproved ? 'border-emerald-200/80 bg-white' : 'bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm font-mono text-slate-900">{c.consultation_id}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(c.started_at).toLocaleDateString()}
                        </span>
                        {c.doctor_name && (
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <Stethoscope className="w-3.5 h-3.5 text-brand-600" />
                            {c.doctor_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/consultations/${c.id}/review`)}
                    >
                      {isApproved ? 'View Approved EHR' : 'Review & Sign'}
                    </Button>
                  </div>

                  {c.chief_complaint && (
                    <div className="mt-3 text-xs text-slate-700">
                      <strong>Chief Complaint:</strong> {c.chief_complaint}
                    </div>
                  )}

                  {c.diagnoses && c.diagnoses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.diagnoses.map((d, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200/80"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {c.medications && c.medications.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                      <Pill className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>{c.medications.join(', ')}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
