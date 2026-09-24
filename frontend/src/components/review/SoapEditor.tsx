import React from 'react';
import { SOAPNote } from '@/types';
import { FileText, ShieldAlert, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

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
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/70 p-4 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-600" />
          <CardTitle className="text-sm font-bold text-slate-800">
            SOAP PROGRESS NOTE
          </CardTitle>
        </div>

        {/* Mandatory Safety Label */}
        {soap.is_ai_draft ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold tracking-wide uppercase shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            AI DRAFT • REQUIRES DOCTOR REVIEW
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold tracking-wide uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            APPROVED CLINICAL RECORD
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Subjective */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
            <span className="text-brand-800">S — Subjective (Patient Narrative & HPI)</span>
            <span className="text-[10px] text-slate-400 font-normal">Editable</span>
          </label>
          <textarea
            rows={3}
            value={soap.subjective || ''}
            disabled={readOnly}
            onChange={(e) => onChange({ subjective: e.target.value })}
            className="w-full text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 leading-relaxed focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Objective */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
            <span className="text-brand-800">O — Objective (Vitals & Physical Findings)</span>
            <span className="text-[10px] text-slate-400 font-normal">Editable</span>
          </label>
          <textarea
            rows={3}
            value={soap.objective || ''}
            disabled={readOnly}
            onChange={(e) => onChange({ objective: e.target.value })}
            className="w-full text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 leading-relaxed focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Assessment */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
            <span className="text-brand-800">A — Assessment (Clinical Formulation & Differentials)</span>
            <span className="text-[10px] text-slate-400 font-normal">Editable</span>
          </label>
          <textarea
            rows={3}
            value={soap.assessment || ''}
            disabled={readOnly}
            onChange={(e) => onChange({ assessment: e.target.value })}
            className="w-full text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 leading-relaxed focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Plan */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
            <span className="text-brand-800">P — Plan (Therapy, Workup, Red Flags & Follow-up)</span>
            <span className="text-[10px] text-slate-400 font-normal">Editable</span>
          </label>
          <textarea
            rows={4}
            value={soap.plan || ''}
            disabled={readOnly}
            onChange={(e) => onChange({ plan: e.target.value })}
            className="w-full text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 leading-relaxed focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Attending Doctor Clinical Addendum */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <span>Attending Physician Final Clinical Addendum / Notes:</span>
          </label>
          <textarea
            rows={2}
            value={soap.doctor_notes || ''}
            disabled={readOnly}
            onChange={(e) => onChange({ doctor_notes: e.target.value })}
            placeholder="Add doctor remarks, patient counseling notes, or specific verbal instructions given..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};
