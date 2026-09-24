import React from 'react';
import { InvestigationSuggestion } from '@/types';
import { FlaskConical, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface InvestigationReviewProps {
  investigations: InvestigationSuggestion[];
  onChange: (updated: InvestigationSuggestion[]) => void;
  readOnly?: boolean;
}

export const InvestigationReview: React.FC<InvestigationReviewProps> = ({
  investigations,
  onChange,
  readOnly = false,
}) => {
  const handleStatusChange = (idx: number, status: string) => {
    const next = [...investigations];
    next[idx] = { ...next[idx], status };
    onChange(next);
  };

  const handleDelete = (idx: number) => {
    const next = investigations.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/70 p-4 pb-3">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-brand-600" />
            DIAGNOSTIC INVESTIGATIONS & LAB WORKUP
          </span>
          <span className="text-xs font-normal text-slate-500">
            Recommendations subject to physician order
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        {investigations.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No diagnostic tests recommended for this encounter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {investigations.map((inv, idx) => (
              <div
                key={inv.id || idx}
                className="p-3 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="font-bold text-slate-900">{inv.name}</div>
                  <div className="text-slate-600 text-xs mt-0.5">{inv.reason}</div>
                  {inv.source && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Guideline: {inv.source}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={inv.status}
                    disabled={readOnly}
                    onChange={(e) => handleStatusChange(idx, e.target.value)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:ring-1 focus:ring-brand-500 focus:outline-none cursor-pointer ${
                      inv.status === 'ORDERED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : inv.status === 'OMITTED'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <option value="RECOMMENDED">RECOMMENDED</option>
                    <option value="ORDERED">ORDERED (Authorized)</option>
                    <option value="OMITTED">OMITTED (Deferred)</option>
                  </select>

                  {!readOnly && (
                    <button
                      onClick={() => handleDelete(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
