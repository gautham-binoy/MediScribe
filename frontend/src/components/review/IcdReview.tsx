import React from 'react';
import { ICDSuggestion } from '@/types';
import { Tag, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface IcdReviewProps {
  icdCodes: ICDSuggestion[];
  onChange: (updated: ICDSuggestion[]) => void;
  readOnly?: boolean;
}

export const IcdReview: React.FC<IcdReviewProps> = ({
  icdCodes,
  onChange,
  readOnly = false,
}) => {
  const handleStatusToggle = (idx: number) => {
    const next = [...icdCodes];
    const curr = next[idx].status;
    next[idx] = { ...next[idx], status: curr === 'ACCEPTED' ? 'SUGGESTED' : 'ACCEPTED' };
    onChange(next);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/70 p-4 pb-3">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-600" />
            ICD-10 CLINICAL CLASSIFICATION SUGGESTIONS
          </span>
          <span className="text-xs font-normal text-slate-500">
            For medical records & diagnosis categorization
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        {icdCodes.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No ICD-10 diagnostic codes suggested.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {icdCodes.map((icd, idx) => {
              const isAccepted = icd.status === 'ACCEPTED';
              return (
                <div
                  key={icd.id || idx}
                  onClick={() => !readOnly && handleStatusToggle(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 text-xs ${
                    isAccepted
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono font-bold text-slate-900 shadow-2xs">
                        {icd.code}
                      </span>
                      <span className="font-semibold text-slate-800">{icd.description}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">{icd.reason}</p>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {isAccepted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
