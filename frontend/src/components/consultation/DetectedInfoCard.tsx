import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface DetectedInfoCardProps {
  symptoms: string[];
  duration?: string;
  allergies?: string;
  warnings?: string[];
}

export const DetectedInfoCard: React.FC<DetectedInfoCardProps> = ({
  symptoms = [],
  duration,
  allergies,
  warnings = [],
}) => {
  const hasInfo = symptoms.length > 0 || duration || allergies;

  return (
    <Card className="border-brand-200/80 bg-gradient-to-b from-white to-brand-50/20">
      <CardHeader className="bg-brand-50/40 pb-2">
        <CardTitle className="text-xs uppercase tracking-wider text-brand-900 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-4 h-4 text-brand-600" />
            AI DETECTED CLINICAL ENTITIES
          </span>
          <span className="text-[10px] font-normal text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-full">
            Real-time Draft
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 pt-3">
        {!hasInfo ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Entities will appear here automatically as doctor & patient converse.
          </div>
        ) : (
          <>
            {/* Symptoms list */}
            {symptoms.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Reported Symptoms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {s}
                    </span>
                  ))}
                  {duration && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                      Duration: {duration}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Allergies */}
            {allergies && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Allergy Status
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{allergies}</span>
                </div>
              </div>
            )}

            {/* Warnings / Red flags */}
            {warnings.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Clinical Red Flags to Verify
                </span>
                <ul className="text-xs text-amber-900 space-y-1">
                  {warnings.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
