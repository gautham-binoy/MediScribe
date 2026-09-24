import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, ShieldCheck, Languages } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TopbarProps {
  isDemoMode?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ isDemoMode = true }) => {
  const navigate = useNavigate();

  const handleStartConsultation = () => {
    if (isDemoMode) {
      navigate('/consultations/new?patient_id=P1001&demo=true');
    } else {
      navigate('/consultations/new');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Mode Indicator */}
        {isDemoMode ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>DEMO MODE ACTIVE</span>
            <span className="text-[10px] text-emerald-600 font-normal border-l border-emerald-200 pl-1.5 ml-0.5">
              Offline Safe • Synthetic Data
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>LIVE CLINICAL MODE</span>
            <span className="text-[10px] text-blue-600 font-normal border-l border-blue-200 pl-1.5 ml-0.5">
              Real-Time AI Pipeline
            </span>
          </div>
        )}

        {/* Multilingual Support Pill */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
          <Languages className="w-3.5 h-3.5 text-brand-600" />
          <span>English & മലയാളം Supported</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Action: Start Consultation */}
        <Button
          size="sm"
          variant="primary"
          onClick={handleStartConsultation}
          icon={<Play className="w-3.5 h-3.5 fill-current" />}
          className="shadow-sm"
        >
          {isDemoMode ? 'Start Demo Consultation' : 'New Consultation'}
        </Button>

        {/* Safety indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Doctor Sign-off Mandatory</span>
        </div>
      </div>
    </header>
  );
};
