import React, { useState } from 'react';
import { Patient } from '@/types';
import {
  User,
  Phone,
  Droplet,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Activity,
  Heart,
  Calendar,
  MapPin,
  AlertCircle,
} from 'lucide-react';

interface CompactPatientStripProps {
  patient: Patient;
  vitals?: Record<string, any>;
}

export const CompactPatientStrip: React.FC<CompactPatientStripProps> = ({ patient, vitals }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if patient has high-risk allergies documented
  const allergyStr = patient.allergies || 'No Known Drug Allergies (NKDA)';
  const hasCriticalAllergy =
    !allergyStr.toUpperCase().includes('NKDA') &&
    !allergyStr.toLowerCase().includes('none') &&
    !allergyStr.toLowerCase().includes('no known');

  // Format vitals pill
  const bp = vitals?.blood_pressure || vitals?.bp || '120/80';
  const hr = vitals?.pulse || vitals?.heart_rate || '74';
  const temp = vitals?.temperature || '98.6°F';
  const spo2 = vitals?.spo2 || '98%';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-200">
      {/* Primary Sleek Summary Bar (Single Row, ~54px) */}
      <div className="p-3 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Avatar, Name & Demographics */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-600 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            {patient.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">{patient.name}</h2>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[11px] font-semibold">
                {patient.patient_id}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {patient.age}y • {patient.gender}
              </span>
              {patient.blood_group && (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/80 flex items-center gap-0.5">
                  <Droplet className="w-2.5 h-2.5" />
                  {patient.blood_group}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Vitals Capsule (Compact & Clear) */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-brand-600" />
            <span>BP:</span>
            <strong className="text-slate-900 font-bold">{bp}</strong>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 font-medium">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>HR:</span>
            <strong className="text-slate-900 font-bold">{hr} bpm</strong>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 font-medium">
            <span>Temp:</span>
            <strong className="text-slate-900 font-bold">{temp}</strong>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 font-medium">
            <span>SpO2:</span>
            <strong className="text-slate-900 font-bold">{spo2}</strong>
          </div>
        </div>

        {/* Right: Allergy Badge & Expand Drawer Toggle */}
        <div className="flex items-center gap-2">
          {hasCriticalAllergy ? (
            <div className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Allergy: <strong className="underline text-rose-700">{allergyStr}</strong></span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>NKDA (Clean)</span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs"
            title={isExpanded ? 'Collapse patient history' : 'Expand full patient profile'}
          >
            <span className="text-[11px] font-medium hidden sm:inline">
              {isExpanded ? 'Less' : 'Details'}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Extended Details Drawer */}
      {isExpanded && (
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 text-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Contact Details</span>
            <div className="mt-1 text-slate-700 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{patient.phone || 'Not recorded'}</span>
              </div>
              {patient.email && <div>{patient.email}</div>}
              {patient.emergency_contact && (
                <div className="text-[11px] text-slate-500">ICE: {patient.emergency_contact}</div>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Chronic Conditions</span>
            <div className="mt-1 text-slate-800 font-medium">
              {patient.existing_conditions || 'None documented'}
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Current Medications</span>
            <div className="mt-1 text-slate-800 font-medium">
              {patient.current_medications || 'None'}
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Residential Address</span>
            <div className="mt-1 text-slate-600 flex items-start gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
              <span>{patient.address || 'Kerala, India'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
