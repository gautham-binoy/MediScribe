import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-navy-900 via-slate-800 to-slate-900 text-white px-6 py-2.5 text-xs flex items-center justify-between border-b border-slate-700/60 shadow-inner">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-md bg-brand-500/20 text-brand-400">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span className="font-semibold text-slate-100">College Expo Ready:</span>
        <span className="text-slate-300 hidden sm:inline">
          Demonstrate mixed Malayalam + English transcription and complete doctor-in-the-loop sign-off.
        </span>
      </div>
      <button
        onClick={() => navigate('/consultations/new?patient_id=P1001&scenario=malayalam_fever')}
        className="flex items-center gap-1.5 text-brand-400 font-semibold hover:text-brand-300 transition-colors ml-4 shrink-0"
      >
        <span>Launch Malayalam Demo</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};
