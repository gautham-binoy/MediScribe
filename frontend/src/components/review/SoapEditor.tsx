import React, { useState } from 'react';
import { SOAPNote } from '@/types';
import {
  FileText,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  UserCheck,
  Stethoscope,
  Activity,
  ClipboardList,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface SoapEditorProps {
  soap: SOAPNote;
  onChange: (updated: Partial<SOAPNote>) => void;
  readOnly?: boolean;
}

export const SoapEditor: React.FC<SoapEditorProps> = ({
  soap,
  onChange,
  readOnly = false,
}) => {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyNote = () => {
    const formatted = `SOAP PROGRESS NOTE
================================
[S] SUBJECTIVE:
${soap.subjective || ''}

[O] OBJECTIVE:
${soap.objective || ''}

[A] ASSESSMENT:
${soap.assessment || ''}

[P] PLAN:
${soap.plan || ''}
================================
Disclaimer: ${soap.disclaimer || 'AI GENERATED - REVIEWED BY PHYSICIAN'}`;

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    success('Copied to Clipboard', 'Full SOAP note formatted and copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* SOAP Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Clinical SOAP Progress Note</h3>
            <p className="text-xs text-slate-500">Standardized medical progress documentation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {soap.is_ai_draft ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold tracking-wide uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              AI DRAFT • VERIFY & EDIT
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              VERIFIED BY PHYSICIAN
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyNote}
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            className="text-xs"
          >
            {copied ? 'Copied' : 'Copy SOAP'}
          </Button>
        </div>
      </div>

      {/* 4 Distinct, Readable SOAP Sections */}
      <div className="grid grid-cols-1 gap-4">
        {/* S — Subjective */}
        <div className="bg-white rounded-2xl border border-sky-200/80 shadow-2xs overflow-hidden transition-all hover:border-sky-300">
          <div className="bg-sky-50/60 px-4 py-2.5 border-b border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                S
              </span>
              <span className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                Subjective — Patient Narrative & Reported History
              </span>
            </div>
            <span className="text-[10px] font-medium text-sky-700">Symptoms, Onset, Chief Complaint</span>
          </div>
          <div className="p-4">
            <textarea
              rows={4}
              value={soap.subjective || ''}
              disabled={readOnly}
              onChange={(e) => onChange({ subjective: e.target.value })}
              className="w-full text-sm font-sans bg-transparent border-0 text-slate-800 leading-relaxed focus:ring-0 focus:outline-none resize-y min-h-[90px]"
              placeholder="Patient reported symptoms, onset, and chronological experience..."
            />
          </div>
        </div>

        {/* O — Objective */}
        <div className="bg-white rounded-2xl border border-indigo-200/80 shadow-2xs overflow-hidden transition-all hover:border-indigo-300">
          <div className="bg-indigo-50/60 px-4 py-2.5 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                O
              </span>
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                Objective — Clinical Vitals & Physical Findings
              </span>
            </div>
            <span className="text-[10px] font-medium text-indigo-700">Measurable Findings & Observations</span>
          </div>
          <div className="p-4">
            <textarea
              rows={3}
              value={soap.objective || ''}
              disabled={readOnly}
              onChange={(e) => onChange({ objective: e.target.value })}
              className="w-full text-sm font-sans bg-transparent border-0 text-slate-800 leading-relaxed focus:ring-0 focus:outline-none resize-y min-h-[80px]"
              placeholder="Vital signs, physical exam observations, general appearance..."
            />
          </div>
        </div>

        {/* A — Assessment */}
        <div className="bg-white rounded-2xl border border-purple-200/80 shadow-2xs overflow-hidden transition-all hover:border-purple-300">
          <div className="bg-purple-50/60 px-4 py-2.5 border-b border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                A
              </span>
              <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                Assessment — Clinical Evaluation & Differential Diagnosis
              </span>
            </div>
            <span className="text-[10px] font-medium text-purple-700">Impression & Disease Staging</span>
          </div>
          <div className="p-4">
            <textarea
              rows={3}
              value={soap.assessment || ''}
              disabled={readOnly}
              onChange={(e) => onChange({ assessment: e.target.value })}
              className="w-full text-sm font-sans bg-transparent border-0 text-slate-800 leading-relaxed focus:ring-0 focus:outline-none resize-y min-h-[80px]"
              placeholder="Clinical evaluation, suspected diagnosis, illness status..."
            />
          </div>
        </div>

        {/* P — Plan */}
        <div className="bg-white rounded-2xl border border-teal-200/80 shadow-2xs overflow-hidden transition-all hover:border-teal-300">
          <div className="bg-teal-50/60 px-4 py-2.5 border-b border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                P
              </span>
              <span className="text-xs font-bold text-teal-950 uppercase tracking-wide">
                Plan — Management, Investigations & Follow-Up Criteria
              </span>
            </div>
            <span className="text-[10px] font-medium text-teal-700">Patient Guidance, Labs & Review</span>
          </div>
          <div className="p-4">
            <textarea
              rows={4}
              value={soap.plan || ''}
              disabled={readOnly}
              onChange={(e) => onChange({ plan: e.target.value })}
              className="w-full text-sm font-sans bg-transparent border-0 text-slate-800 leading-relaxed focus:ring-0 focus:outline-none resize-y min-h-[90px]"
              placeholder="Therapeutic management, lab tests, patient advice, follow-up..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
