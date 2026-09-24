import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stethoscope, Search, Sparkles, ArrowRight, UserCheck, Languages, AlertCircle } from 'lucide-react';
import { patientsApi, consultationsApi } from '@/api/client';
import { Patient } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LanguageSelector } from '@/components/consultation/LanguageSelector';
import { useToast } from '@/contexts/ToastContext';

export const NewConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { error: toastError } = useToast();

  const [patientIdInput, setPatientIdInput] = useState(searchParams.get('patient_id') || 'P1001');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [conversationLanguage, setConversationLanguage] = useState('Malayalam + English');
  const [outputLanguage, setOutputLanguage] = useState('English');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatient = (id: string, showToastOnFail = false) => {
    if (!id.trim()) return;
    setLoadingPatient(true);
    patientsApi
      .getById(id.trim())
      .then((p) => {
        setPatient(p);
      })
      .catch((err) => {
        setPatient(null);
        if (showToastOnFail) {
          toastError(
            'Patient Not Found',
            `No patient record matching "${id.trim()}" exists. Please check the ID or select one of the quick picks below.`
          );
        }
      })
      .finally(() => setLoadingPatient(false));
  };

  useEffect(() => {
    if (patientIdInput) {
      fetchPatient(patientIdInput);
    }
  }, []);

  const handleStartConsultation = async () => {
    if (!patient) {
      toastError('Patient Required', 'Please select or search a valid patient ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const consultation = await consultationsApi.create({
        patient_id: patient.id,
        conversation_language: conversationLanguage,
        output_language: outputLanguage,
        is_demo: true,
      });

      // Pass preset scenario if requested in URL
      const scenarioParam = searchParams.get('scenario');
      const url = scenarioParam
        ? `/consultations/${consultation.id}?scenario=${encodeURIComponent(scenarioParam)}`
        : `/consultations/${consultation.id}`;

      navigate(url);
    } catch (err: any) {
      toastError('Failed to Start Consultation', err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-brand-600" />
          Initialize Clinical Consultation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select or search a patient profile, configure conversation language, and start documentation copilot.
        </p>
      </div>

      {/* Step 1: Patient Search / Selection */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-slate-800">
            STEP 1: PATIENT IDENTIFICATION
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Enter Patient ID (e.g. P1001, P1002)..."
                value={patientIdInput}
                onChange={(e) => setPatientIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPatient(patientIdInput, true)}
                className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchPatient(patientIdInput, true)}
              isLoading={loadingPatient}
            >
              Find Patient
            </Button>
          </div>

          {/* Quick seeded patient selector pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium block">
              Quick Select Synthetic Patients:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'P1001', name: 'Rahul Nair (Fever Demo)', tag: 'Malayalam+Eng' },
                { id: 'P1002', name: 'Ananya Sharma', tag: 'Asthma/Penicillin' },
                { id: 'P1003', name: 'Mathew Joseph', tag: 'HTN Approved EHR' },
                { id: 'P1004', name: 'Priya Kurian', tag: 'Diabetes' },
                { id: 'P1005', name: 'Arjun Varma', tag: 'Dyslipidemia' },
              ].map((pItem) => (
                <button
                  key={pItem.id}
                  type="button"
                  onClick={() => {
                    setPatientIdInput(pItem.id);
                    fetchPatient(pItem.id);
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border text-left transition-all flex items-center gap-1.5 ${
                    patientIdInput === pItem.id
                      ? 'border-brand-500 bg-brand-50/70 text-brand-900 font-semibold'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="font-mono text-[11px] font-bold">{pItem.id}</span>
                  <span>{pItem.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Patient Summary Card */}
          {patient ? (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm text-slate-900">{patient.name}</span>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-800">
                    {patient.patient_id}
                  </span>
                </div>
                <span className="text-xs text-slate-600 font-medium">
                  {patient.age} yrs • {patient.gender} • {patient.blood_group || 'O+'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-100 text-slate-700">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Allergies:</span>
                  <span className="font-medium text-amber-800">{patient.allergies || 'NKDA'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Conditions:</span>
                  <span className="font-medium">{patient.existing_conditions || 'None'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
              Enter a valid patient ID above to preview demographics and past medical history.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Language Settings */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-slate-800">
            STEP 2: MULTILINGUAL RECOGNITION SETTINGS
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 space-y-3">
          <LanguageSelector
            conversationLanguage={conversationLanguage}
            onConversationLanguageChange={setConversationLanguage}
            outputLanguage={outputLanguage}
            onOutputLanguageChange={setOutputLanguage}
          />
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-700 font-semibold">Malayalam Code-Switching:</strong> The patient can speak Malayalam while the doctor speaks English or Malayalam. Original speech will be verbatim-transcribed in Unicode (മലയാളം), and normalized into English clinical documentation.
          </div>
        </CardContent>
      </Card>

      {/* Submit Action */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/dashboard')}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleStartConsultation}
          disabled={!patient}
          isLoading={isSubmitting}
          icon={<ArrowRight className="w-4 h-4" />}
          className="shadow-md shadow-brand-500/20"
        >
          Launch Consultation Session
        </Button>
      </div>
    </div>
  );
};
