import React from 'react';
import { TranscriptSegment } from '@/types';
import { MessageSquare, Stethoscope, User, Sparkles } from 'lucide-react';

interface LiveTranscriptProps {
  segments: TranscriptSegment[];
  isRecording?: boolean;
  detectedLanguage?: string;
  normalizedPreview?: string;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  segments,
  isRecording = false,
  detectedLanguage,
  normalizedPreview,
}) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">LIVE CLINICAL TRANSCRIPT</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {detectedLanguage && (
            <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-medium text-[11px]">
              {detectedLanguage}
            </span>
          )}
          {isRecording && (
            <span className="flex items-center gap-1.5 text-rose-600 font-semibold text-xs px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              Live Listening
            </span>
          )}
        </div>
      </div>

      {/* Transcript dialogue scroll area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 min-h-[320px] max-h-[500px]">
        {segments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600">No dialogue recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Start microphone recording or click "Simulate Malayalam + English Demo" to stream live speech.
            </p>
          </div>
        ) : (
          segments.map((seg, idx) => {
            const isDoctor = seg.speaker === 'Doctor';
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 animate-fade-in ${
                  isDoctor ? 'flex-row' : 'flex-row'
                }`}
              >
                {/* Speaker Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-xs font-bold ${
                    isDoctor
                      ? 'bg-brand-600 text-white shadow-brand-500/20'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {isDoctor ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Speech Bubble */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-800">
                      {isDoctor ? '👨‍⚕️ Doctor' : '👤 Patient'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{seg.timestamp}</span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed border ${
                      isDoctor
                        ? 'bg-brand-50/60 border-brand-100 text-slate-900 rounded-tl-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-900 rounded-tl-sm'
                    }`}
                  >
                    <p className="malayalam-text font-normal">{seg.text}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Normalized English Preview Footer (if available) */}
      {normalizedPreview && (
        <div className="p-3.5 bg-slate-900 text-white border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-brand-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Real-time Clinical Normalization (English):</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
            {normalizedPreview}
          </p>
        </div>
      )}
    </div>
  );
};
