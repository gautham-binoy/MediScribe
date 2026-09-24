import React from 'react';
import { Patient } from '@/types';
import { User, Phone, Droplet, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface PatientCardProps {
  patient: Patient;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  return (
    <Card className="bg-gradient-to-r from-slate-900 to-navy-900 text-white border-slate-800 shadow-md">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-lg shrink-0">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{patient.name}</h2>
                <span className="px-2 py-0.5 rounded-md bg-brand-500/20 border border-brand-500/30 text-brand-300 font-mono text-xs font-semibold">
                  {patient.patient_id}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                <span>{patient.age} years old</span>
                <span>•</span>
                <span>{patient.gender}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {patient.phone}
                </span>
                {patient.blood_group && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-rose-300 font-medium">
                      <Droplet className="w-3 h-3" />
                      {patient.blood_group}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Alerts summary */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-semibold">
                Recorded Allergies
              </span>
              <span className="font-semibold text-amber-300 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                {patient.allergies || 'NKDA'}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-semibold">
                Existing Conditions
              </span>
              <span className="font-medium text-slate-200 mt-0.5 block">
                {patient.existing_conditions || 'None'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
