import React, { useState } from 'react';
import { Prescription, PrescriptionItem, SafetyAlert } from '@/types';
import { Pill, Plus, Trash2, ShieldAlert, CheckCircle2, AlertCircle, ShieldCheck, FileDown, RotateCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PrescriptionReviewProps {
  prescription: Prescription;
  patientAllergies?: string;
  safetyAlerts?: SafetyAlert[];
  onCheckSafety?: () => Promise<void>;
  isCheckingSafety?: boolean;
  onDownloadPdf?: () => void;
  onChange: (updated: Partial<Prescription>) => void;
  readOnly?: boolean;
}

export const PrescriptionReview: React.FC<PrescriptionReviewProps> = ({
  prescription,
  patientAllergies,
  safetyAlerts = [],
  onCheckSafety,
  isCheckingSafety = false,
  onDownloadPdf,
  onChange,
  readOnly = false,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<PrescriptionItem>>({
    medication_name: '',
    strength: '',
    dose: '1 tablet',
    route: 'Oral',
    frequency: 'TDS (Thrice daily)',
    duration: '3 days',
    instructions: 'Take after food',
    is_approved: false,
  });

  const handleItemChange = (idx: number, field: keyof PrescriptionItem, value: any) => {
    const nextItems = [...prescription.items];
    nextItems[idx] = { ...nextItems[idx], [field]: value };
    onChange({ items: nextItems });
  };

  const handleDeleteItem = (idx: number) => {
    const nextItems = prescription.items.filter((_, i) => i !== idx);
    onChange({ items: nextItems });
  };

  const handleAddItem = () => {
    if (!newItem.medication_name?.trim()) return;
    const itemToAdd: PrescriptionItem = {
      id: Math.random().toString(36).substring(2, 9),
      medication_name: newItem.medication_name.trim(),
      strength: newItem.strength || '500mg',
      dose: newItem.dose || '1 tablet',
      route: newItem.route || 'Oral',
      frequency: newItem.frequency || 'Once daily',
      duration: newItem.duration || '3 days',
      instructions: newItem.instructions || 'After meals',
      is_approved: false,
    };
    onChange({ items: [...prescription.items, itemToAdd] });
    setNewItem({
      medication_name: '',
      strength: '',
      dose: '1 tablet',
      route: 'Oral',
      frequency: 'TDS (Thrice daily)',
      duration: '3 days',
      instructions: 'Take after food',
      is_approved: false,
    });
    setShowAddModal(false);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/70 p-4 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-brand-600" />
          <CardTitle className="text-sm font-bold text-slate-800">
            PRESCRIPTION PROPOSAL & MEDICATION DRAFT
          </CardTitle>
        </div>

        {/* Safety Disclaimer Header */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold tracking-wide uppercase">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          DOCTOR SIGNATURE MANDATORY
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Dynamic Live Drug-Allergy & Drug-Drug Conflict Alerts */}
        {safetyAlerts && safetyAlerts.length > 0 ? (
          <div className="space-y-3">
            {safetyAlerts.map((alert, idx) => {
              if (alert.severity === 'CRITICAL') {
                return (
                  <div
                    key={idx}
                    className="p-4 bg-rose-50 border-2 border-rose-400 rounded-xl text-xs space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-rose-950 font-bold text-sm">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
                        <span>CRITICAL CONTRAINDICATION: {alert.title}</span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white tracking-wide">
                        BLOCKING SAFETY ALERT
                      </span>
                    </div>
                    <div className="text-rose-900 font-medium">
                      <strong>Conflict Identified:</strong> {alert.medication} ⇄ {alert.conflict_source}
                    </div>
                    <div className="text-rose-800 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-rose-200">
                      <strong>Clinical Risk:</strong> {alert.clinical_explanation}
                    </div>
                    <div className="text-emerald-950 bg-emerald-50/90 p-2.5 rounded-lg border border-emerald-300 font-medium">
                      <strong>Physician Action / Recommendation:</strong> {alert.recommendation}
                    </div>
                  </div>
                );
              }

              if (alert.severity === 'WARNING') {
                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-amber-950 font-bold">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>CAUTION: {alert.title}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                        MODERATE CONFLICT
                      </span>
                    </div>
                    <div className="text-amber-900">
                      <strong>Conflict:</strong> {alert.medication} ({alert.conflict_source})
                    </div>
                    <div className="text-amber-800 text-[11px] leading-relaxed">
                      {alert.clinical_explanation}
                    </div>
                    <div className="text-amber-950 font-semibold text-[11px] mt-0.5 bg-white/60 p-2 rounded-lg border border-amber-200">
                      <strong>Recommendation:</strong> {alert.recommendation}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 text-emerald-950 font-medium">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-900">{alert.title}</span> — {alert.clinical_explanation}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    VERIFIED SAFE
                  </span>
                </div>
              );
            })}
          </div>
        ) : patientAllergies?.toLowerCase().includes('penicillin') ? (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                ⚠ Penicillin allergy: <strong className="underline">{patientAllergies}</strong> (Beta-lactams strictly withheld by safety copilot)
              </span>
            </div>
            <span className="text-[10px] text-amber-800 font-bold uppercase bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
              Safety Guard Active
            </span>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Allergy Cross-Check Active: <strong className="font-semibold">{patientAllergies || 'NKDA'}</strong>
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold uppercase bg-emerald-100/60 px-2 py-0.5 rounded-full">
              No Contraindications Flagged
            </span>
          </div>
        )}

        {/* Items Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Medication</th>
                <th className="p-3">Strength & Dose</th>
                <th className="p-3">Route</th>
                <th className="p-3">Frequency</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Instructions</th>
                {!readOnly && <th className="p-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {prescription.items && prescription.items.length > 0 ? (
                prescription.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">
                      {readOnly ? (
                        item.medication_name
                      ) : (
                        <input
                          type="text"
                          value={item.medication_name}
                          onChange={(e) => handleItemChange(idx, 'medication_name', e.target.value)}
                          className="bg-transparent border-b border-slate-200 focus:border-brand-500 focus:outline-none w-full font-bold"
                        />
                      )}
                    </td>
                    <td className="p-3">
                      {readOnly ? (
                        `${item.strength} (${item.dose})`
                      ) : (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={item.strength}
                            onChange={(e) => handleItemChange(idx, 'strength', e.target.value)}
                            className="bg-transparent border-b border-slate-200 focus:border-brand-500 focus:outline-none w-16"
                          />
                          <input
                            type="text"
                            value={item.dose}
                            onChange={(e) => handleItemChange(idx, 'dose', e.target.value)}
                            className="bg-transparent border-b border-slate-200 focus:border-brand-500 focus:outline-none w-20"
                          />
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{item.route}</td>
                    <td className="p-3">
                      {readOnly ? (
                        item.frequency
                      ) : (
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                          className="bg-transparent border-b border-slate-200 focus:border-brand-500 focus:outline-none w-full"
                        />
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{item.duration}</td>
                    <td className="p-3 text-slate-600 text-[11px]">{item.instructions || 'With water'}</td>
                    {!readOnly && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No medications currently drafted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add item and Actions toolbar */}
        <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddModal(!showAddModal)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Medication
              </Button>
            )}

            {onCheckSafety && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCheckSafety}
                isLoading={isCheckingSafety}
                icon={<ShieldCheck className="w-3.5 h-3.5 text-brand-600" />}
                title="Run live drug-allergy and drug-drug conflict checks"
              >
                Re-evaluate Safety Conflicts
              </Button>
            )}
          </div>

          {onDownloadPdf && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDownloadPdf}
              icon={<FileDown className="w-3.5 h-3.5 text-brand-600" />}
              className="border-brand-200 hover:bg-brand-50 text-brand-900 font-semibold"
            >
              Download Official Rx PDF
            </Button>
          )}
        </div>

        {/* Inline Add Item Form */}
        {showAddModal && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-semibold text-slate-800">Add Formulation:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Medication name..."
                value={newItem.medication_name}
                onChange={(e) => setNewItem({ ...newItem, medication_name: e.target.value })}
                className="bg-white border border-slate-200 rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="Strength (e.g. 650mg)"
                value={newItem.strength}
                onChange={(e) => setNewItem({ ...newItem, strength: e.target.value })}
                className="bg-white border border-slate-200 rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="Frequency (e.g. TDS)"
                value={newItem.frequency}
                onChange={(e) => setNewItem({ ...newItem, frequency: e.target.value })}
                className="bg-white border border-slate-200 rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="Duration (e.g. 3 days)"
                value={newItem.duration}
                onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                className="bg-white border border-slate-200 rounded-lg p-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleAddItem}>
                Add to Prescription
              </Button>
            </div>
          </div>
        )}

        {/* General patient advice */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            General Lifestyle, Dietary & Hydration Instructions
          </label>
          <textarea
            rows={2}
            value={prescription.general_instructions || ''}
            disabled={readOnly}
            onChange={(e) => onChange({ general_instructions: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            placeholder="e.g. High fluid intake, adequate bed rest, avoid chilled beverages..."
          />
        </div>
      </CardContent>
    </Card>
  );
};
