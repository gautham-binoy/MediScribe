import React, { useState } from 'react';
import { MessageSquare, Sparkles, Copy, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface OriginalTranscriptCardProps {
  originalTranscript: string;
  normalizedText: string;
  clinicalSummary?: string;
  detectedLanguage?: string;
}

export const OriginalTranscriptCard: React.FC<OriginalTranscriptCardProps> = ({
  originalTranscript,
  normalizedText,
  clinicalSummary,
  detectedLanguage = 'Malayalam + English',
}) => {
  const [activeTab, setActiveTab] = useState<'original' | 'interpretation'>('original');
  const [copied, setCopied] = useState(false);

  const isLanguageUncertain =
    !detectedLanguage ||
    detectedLanguage.toLowerCase().includes('uncertain') ||
    detectedLanguage.toLowerCase().includes('unknown');

  const formattedLanguageBadge = isLanguageUncertain
    ? 'Language detection uncertain.'
    : `Detected language: ${detectedLanguage}`;

  const handleCopy = () => {
    const textToCopy = activeTab === 'original' ? originalTranscript : normalizedText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/70 p-4 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            CONSULTATION TRANSCRIPTION & CLINICAL INTERPRETATION
          </CardTitle>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${
              isLanguageUncertain
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-brand-50 border-brand-200 text-brand-700'
            }`}
          >
            {isLanguageUncertain && <AlertCircle className="w-3 h-3 text-amber-600" />}
            {formattedLanguageBadge}
          </span>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              activeTab === 'original'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Original Conversation
          </button>
          <button
            onClick={() => setActiveTab('interpretation')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
              activeTab === 'interpretation'
                ? 'bg-white text-brand-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-brand-600" />
            AI Clinical Interpretation
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="relative">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto">
            {activeTab === 'original' ? (
              <p className="malayalam-text text-slate-800 font-normal">
                {originalTranscript || 'No original conversation recorded.'}
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-800 font-sans">
                  {normalizedText || 'No clinical interpretation available.'}
                </p>
                {clinicalSummary && (
                  <div className="p-2.5 rounded-lg bg-white border border-brand-100 text-xs text-brand-900">
                    <span className="font-bold text-brand-700">Clinical Summary: </span>
                    {clinicalSummary}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-500 hover:text-slate-800 shadow-xs text-xs flex items-center gap-1 transition-all"
            title="Copy text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] text-emerald-700 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            {activeTab === 'original'
              ? 'Verbatim multilingual dialogue strictly preserved for legal & clinical record.'
              : 'Medical terms normalized to standard clinical English for EHR documentation.'}
          </span>
          <span className="font-mono text-[10px]">Unicode Noto Sans Malayalam</span>
        </div>
      </CardContent>
    </Card>
  );
};
