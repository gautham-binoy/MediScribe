import React from 'react';
import { BookOpen, ShieldCheck, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface RagSourcesCardProps {
  sources?: string[];
}

export const RagSourcesCard: React.FC<RagSourcesCardProps> = ({ sources = [] }) => {
  const hasSources = sources && sources.length > 0;

  return (
    <Card className="border-slate-200 bg-slate-50/50 shadow-xs">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-brand-600" />
            EVIDENCE-BASED CLINICAL SOURCES (RAG)
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              hasSources
                ? 'text-brand-700 bg-brand-100/60'
                : 'text-slate-500 bg-slate-200/60'
            }`}
          >
            {hasSources ? 'Indexed Guidelines' : 'Zero Source Mode'}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-1">
        {hasSources ? (
          <div className="space-y-1.5 text-xs text-slate-600">
            {sources.map((src, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span className="truncate">{src}</span>
              </div>
            ))}
            <div className="mt-2 text-[10px] text-slate-400">
              AI recommendations grounded in local verified reference documents.
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-100/80 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>No reference source used.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
