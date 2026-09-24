import React, { useState } from 'react';
import { PatientCareGuide } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HeartPulse,
  Languages,
  Clock,
  Utensils,
  AlertTriangle,
  CalendarCheck,
  Copy,
  Check,
  RotateCw,
  FileDown,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface BilingualPatientGuideProps {
  guideJson?: PatientCareGuide;
  guideEnglish?: string;
  guideMalayalam?: string;
  onRegenerate?: () => Promise<void>;
  onDownloadPdf?: () => void;
  isRegenerating?: boolean;
}

export const BilingualPatientGuide: React.FC<BilingualPatientGuideProps> = ({
  guideJson,
  guideEnglish,
  guideMalayalam,
  onRegenerate,
  onDownloadPdf,
  isRegenerating = false,
}) => {
  const { success } = useToast();
  const [viewMode, setViewMode] = useState<'dual' | 'ml' | 'en'>('dual');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let textToCopy = '';
    if (viewMode === 'ml') {
      textToCopy = guideMalayalam || '';
    } else if (viewMode === 'en') {
      textToCopy = guideEnglish || '';
    } else {
      textToCopy = `${guideEnglish || ''}\n\n===============================\n\n${guideMalayalam || ''}`;
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      success('Copied to Clipboard', 'Patient care instructions copied successfully.');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Fallback defaults if guideJson is not yet populated
  const titleEn = guideJson?.title_en || 'Patient Care & Recovery Instructions';
  const titleMl = guideJson?.title_ml || 'രോഗി പരിചരണ നിർദ്ദേശങ്ങൾ';
  const diagEn = guideJson?.diagnosis_summary_en || 'Take medications on time, rest well, and maintain good hydration for a prompt recovery.';
  const diagMl = guideJson?.diagnosis_summary_ml || 'ഡോക്ടർ നിർദ്ദേശിച്ച മരുന്നുകൾ കൃത്യസമയത്ത് കഴിക്കുകയും ധാരാളം വിശ്രമവും വെള്ളവും എടുക്കുകയും ചെയ്യുക.';
  const schedule = guideJson?.medication_schedule || [];
  const dietEn = guideJson?.diet_and_lifestyle_en || [
    'Drink 2.5 to 3 liters of warm, boiled water throughout the day.',
    'Eat light, warm, easily digestible meals (rice porridge, soup).',
    'Avoid cold drinks, heavy oily items, and excessive spices.',
    'Get at least 8 hours of restful sleep daily.',
  ];
  const dietMl = guideJson?.diet_and_lifestyle_ml || [
    'ധാരാളം തിളപ്പിച്ചാറിയ ചെറുചൂടുവെള്ളം കുടിക്കുക (ദിവസവും 2.5 - 3 ലിറ്റർ).',
    'എളുപ്പത്തിൽ ദഹിക്കുന്ന ലഘുഭക്ഷണം (കഞ്ഞി, സൂപ്പ്) കഴിക്കുക.',
    'തണുത്ത വെള്ളം, ഐസ്ക്രീം, എണ്ണയിൽ വറുത്ത ഭക്ഷണങ്ങൾ എന്നിവ ഒഴിവാക്കുക.',
    'ദിവസവും 8 മണിക്കൂർ സുഖമായി വിശ്രമിക്കുക.',
  ];
  const warningsEn = guideJson?.warning_signs_en || [
    'High fever persisting above 102°F despite antipyretic medication.',
    'Difficulty breathing, wheezing, or chest discomfort.',
    'Severe dizziness, fainting, or inability to retain fluids.',
  ];
  const warningsMl = guideJson?.warning_signs_ml || [
    'മരുന്ന് കഴിച്ചിട്ടും മാറാത്ത കഠിനമായ ഉയർന്ന പനി (102°F-ൽ കൂടുതൽ).',
    'ശ്വാസമെടുക്കാൻ ബുദ്ധിമുട്ട് അല്ലെങ്കിൽ നെഞ്ചിൽ അസ്വസ്ഥത.',
    'കടുത്ത തലകറക്കം അല്ലെങ്കിൽ വെള്ളം പോലും കുടിക്കാൻ കഴിയാത്ത അവസ്ഥ.',
  ];
  const followUpEn = guideJson?.follow_up_en || 'Review in OPD after 3-5 days or immediately if symptoms worsen.';
  const followUpMl = guideJson?.follow_up_ml || '3-5 ദിവസങ്ങൾക്ക് ശേഷം വീണ്ടും കാണിക്കുക; അസ്വസ്ഥത കൂടിയാൽ ഉടൻ ആശുപത്രിയിലെത്തുക.';

  return (
    <Card className="border-teal-200/80 shadow-sm bg-linear-to-b from-white to-teal-50/20 overflow-hidden">
      <CardHeader className="bg-teal-50/60 p-4 border-b border-teal-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-teal-950">
                Bilingual Patient Care Guide (മലയാളം + English)
              </CardTitle>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                Dual-Language AI
              </span>
            </div>
            <p className="text-xs text-teal-700 mt-0.5">
              Empathetic after-care, medication timings & danger signs in native Malayalam & English
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-white rounded-xl border border-teal-200 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setViewMode('dual')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'dual' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dual View
            </button>
            <button
              onClick={() => setViewMode('ml')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'ml' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              മലയാളം Only
            </button>
            <button
              onClick={() => setViewMode('en')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'en' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English Only
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            className="border-teal-200 hover:bg-teal-50 text-teal-900"
          >
            {copied ? 'Copied' : 'Copy Guide'}
          </Button>

          {onDownloadPdf && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadPdf}
              icon={<FileDown className="w-3.5 h-3.5 text-brand-600" />}
              className="border-brand-200 hover:bg-brand-50 text-brand-900 font-semibold"
            >
              Rx PDF
            </Button>
          )}

          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              isLoading={isRegenerating}
              icon={<RotateCw className="w-3.5 h-3.5" />}
              title="Regenerate bilingual guide with AI"
              className="border-teal-200 text-teal-800"
            >
              Regenerate
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* 1. DIAGNOSIS EXPLANATION SECTION */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span>Diagnosis & Recovery Overview / രോഗ വിവരണം</span>
          </div>

          <div className={`grid gap-4 ${viewMode === 'dual' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {(viewMode === 'dual' || viewMode === 'en') && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">English</span>
                <h4 className="text-xs font-bold text-slate-900">{titleEn}</h4>
                <p className="text-xs text-slate-700 leading-relaxed mt-1">{diagEn}</p>
              </div>
            )}

            {(viewMode === 'dual' || viewMode === 'ml') && (
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-teal-700 tracking-wider">മലയാളം (Malayalam)</span>
                <h4 className="text-xs font-bold text-teal-950 font-sans">{titleMl}</h4>
                <p className="text-xs text-teal-900 leading-relaxed mt-1 font-sans">{diagMl}</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. MEDICATION SCHEDULE (TIME TABLE) */}
        {schedule.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Medication Schedule & Timing / മരുന്ന് കഴിക്കേണ്ട വിധം</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Medication / മരുന്ന്</th>
                    {(viewMode === 'dual' || viewMode === 'en') && <th className="p-3">When to Take (English)</th>}
                    {(viewMode === 'dual' || viewMode === 'ml') && <th className="p-3">എപ്പോൾ കഴിക്കണം (മലയാളം)</th>}
                    {(viewMode === 'dual' || viewMode === 'en') && <th className="p-3">Purpose (English)</th>}
                    {(viewMode === 'dual' || viewMode === 'ml') && <th className="p-3">ഉദ്ദേശ്യം (മലയാളം)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {schedule.map((item, idx) => (
                    <tr key={idx} className="hover:bg-teal-50/30">
                      <td className="p-3 font-bold text-slate-900">
                        {item.medication}
                        {item.special_notes && (
                          <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                            Note: {item.special_notes}
                          </div>
                        )}
                      </td>
                      {(viewMode === 'dual' || viewMode === 'en') && (
                        <td className="p-3 text-slate-700">{item.timing_en}</td>
                      )}
                      {(viewMode === 'dual' || viewMode === 'ml') && (
                        <td className="p-3 text-teal-900 font-sans font-medium">{item.timing_ml}</td>
                      )}
                      {(viewMode === 'dual' || viewMode === 'en') && (
                        <td className="p-3 text-slate-600 text-[11px]">{item.purpose_en}</td>
                      )}
                      {(viewMode === 'dual' || viewMode === 'ml') && (
                        <td className="p-3 text-teal-800 text-[11px] font-sans">{item.purpose_ml}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. DIET & LIFESTYLE ADVICE */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <span>Dietary & Lifestyle Advice / ഭക്ഷണവും ജീവിതശൈലി നിർദ്ദേശങ്ങളും</span>
          </div>

          <div className={`grid gap-4 ${viewMode === 'dual' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {(viewMode === 'dual' || viewMode === 'en') && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">English Guidelines</span>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                  {dietEn.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(viewMode === 'dual' || viewMode === 'ml') && (
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">മലയാളം നിർദ്ദേശങ്ങൾ</span>
                <ul className="mt-2 space-y-1.5 text-xs text-emerald-950 font-sans">
                  {dietMl.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 4. EMERGENCY WARNING RED FLAGS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>When to Seek Urgent Hospital Care / അടിയന്തരമായി ഡോക്ടറെ കാണേണ്ട ലക്ഷണങ്ങൾ</span>
          </div>

          <div className={`grid gap-4 ${viewMode === 'dual' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {(viewMode === 'dual' || viewMode === 'en') && (
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">Emergency Red Flags (English)</span>
                <ul className="mt-2 space-y-1.5 text-xs text-rose-900">
                  {warningsEn.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2 font-medium">
                      <span className="text-rose-600 shrink-0">⚠</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(viewMode === 'dual' || viewMode === 'ml') && (
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">അടിയന്തര മുന്നറിയിപ്പുകൾ (മലയാളം)</span>
                <ul className="mt-2 space-y-1.5 text-xs text-rose-950 font-sans">
                  {warningsMl.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2 font-medium">
                      <span className="text-rose-600 shrink-0">⚠</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 5. FOLLOW-UP ADVICE */}
        <div className="p-4 rounded-xl bg-linear-to-r from-teal-50 to-brand-50 border border-teal-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-4.5 h-4.5 text-teal-700 shrink-0" />
            <div>
              <span className="font-bold text-teal-950">Follow-Up Review / തുടർപരിശോധന:</span>
              <div className="text-teal-900 mt-0.5">
                {(viewMode === 'dual' || viewMode === 'en') && <span>{followUpEn}</span>}
                {viewMode === 'dual' && <span className="mx-2 text-teal-400">|</span>}
                {(viewMode === 'dual' || viewMode === 'ml') && <span className="font-sans font-medium">{followUpMl}</span>}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
