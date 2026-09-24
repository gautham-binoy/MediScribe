import React from 'react';
import { ClinicalExtraction } from '@/types';
import { Stethoscope, AlertTriangle, HelpCircle, Activity, HeartPulse } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface ExtractionReviewProps {
  extraction: ClinicalExtraction;
  onChange: (updated: Partial<ClinicalExtraction>) => void;
  readOnly?: boolean;
}

export const ExtractionReview: React.FC<ExtractionReviewProps> = ({
  extraction,
  onChange,
  readOnly = false,
}) => {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/70 p-4 pb-3">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            STRUCTURED CLINICAL EXTRACTION
          </span>
          <span className="text-xs font-normal text-slate-500">
            Factual entity extraction from conversation
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Chief complaint & duration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chief Complaint
            </label>
            <input
              type="text"
              value={extraction.chief_complaint || ''}
              disabled={readOnly}
              onChange={(e) => onChange({ chief_complaint: e.target.value })}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
              placeholder="e.g. Fever for 3 days"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duration & Severity
            </label>
            <input
              type="text"
              value={`${extraction.symptom_duration || 'Not documented'} (${extraction.symptom_severity || 'Moderate'})`}
              disabled={readOnly}
              onChange={(e) => onChange({ symptom_duration: e.target.value })}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Symptoms tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Explicit Symptoms Reported
          </label>
          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 min-h-[38px]">
            {extraction.symptoms && extraction.symptoms.length > 0 ? (
              extraction.symptoms.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 shadow-xs text-slate-800"
                >
                  ✓ {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No specific symptoms extracted</span>
            )}
          </div>
        </div>

        {/* HPI narrative */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            History of Present Illness (HPI)
          </label>
          <textarea
            rows={2}
            value={extraction.history_of_present_illness || ''}
            disabled={readOnly}
            onChange={(e) => onChange({ history_of_present_illness: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 leading-relaxed focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Vitals and Examination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
              Recorded Vitals
            </label>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              {extraction.vitals && Object.keys(extraction.vitals).length > 0 ? (
                Object.entries(extraction.vitals).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="capitalize font-medium text-slate-500">{k.replace('_', ' ')}:</span>
                    <span className="font-semibold text-slate-800">{String(v)}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400">Vitals not recorded in dialogue</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-brand-600" />
              Physical Examination Observations
            </label>
            <textarea
              rows={3}
              value={extraction.examination_findings || 'Systemic examination unremarkable.'}
              disabled={readOnly}
              onChange={(e) => onChange({ examination_findings: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Warnings & Unanswered Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          {/* Important Warnings */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Safety Red Flags & Precautions
            </span>
            <ul className="text-xs text-amber-900 space-y-1">
              {extraction.important_warnings && extraction.important_warnings.length > 0 ? (
                extraction.important_warnings.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))
              ) : (
                <li className="text-amber-700">No acute red flags identified.</li>
              )}
            </ul>
          </div>

          {/* Unanswered Questions */}
          <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/80">
            <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              Questions to Clarify with Patient
            </span>
            <ul className="text-xs text-sky-900 space-y-1">
              {extraction.unanswered_questions && extraction.unanswered_questions.length > 0 ? (
                extraction.unanswered_questions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-sky-500 font-bold">•</span>
                    <span>{q}</span>
                  </li>
                ))
              ) : (
                <li className="text-sky-700">All standard clinical queries addressed.</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
