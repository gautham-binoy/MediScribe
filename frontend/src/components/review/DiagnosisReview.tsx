import React, { useState } from 'react';
import { DiagnosisSuggestion } from '@/types';
import { Stethoscope, Plus, Trash2, CheckCircle2, XCircle, Edit3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DiagnosisReviewProps {
  diagnoses: DiagnosisSuggestion[];
  onChange: (updated: DiagnosisSuggestion[]) => void;
  readOnly?: boolean;
}

export const DiagnosisReview: React.FC<DiagnosisReviewProps> = ({
  diagnoses,
  onChange,
  readOnly = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newConfidence, setNewConfidence] = useState('Moderate');

  const handleStatusChange = (idx: number, newStatus: string) => {
    const next = [...diagnoses];
    next[idx] = { ...next[idx], status: newStatus };
    onChange(next);
  };

  const handleDelete = (idx: number) => {
    const next = diagnoses.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleAdd = () => {
    if (!newCondition.trim()) return;
    const newDiag: DiagnosisSuggestion = {
      id: Math.random().toString(36).substring(2, 9),
      consultation_id: '',
      condition: newCondition.trim(),
      reason: newReason.trim() || 'Added by attending physician',
      confidence: newConfidence,
      source: 'Doctor Clinical Assessment',
      status: 'ACCEPTED',
      created_at: new Date().toISOString(),
    };
    onChange([...diagnoses, newDiag]);
    setNewCondition('');
    setNewReason('');
    setShowAddForm(false);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/70 p-4 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-brand-600" />
          <CardTitle className="text-sm font-bold text-slate-800">
            SUGGESTED DIFFERENTIAL DIAGNOSES
          </CardTitle>
        </div>

        {!readOnly && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Diagnosis
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Add Form */}
        {showAddForm && (
          <div className="p-3.5 bg-brand-50/40 border border-brand-200 rounded-xl space-y-2.5 animate-slide-in">
            <div className="font-semibold text-xs text-brand-900">Add Clinical Diagnosis:</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Condition name..."
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 md:col-span-2 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
              <select
                value={newConfidence}
                onChange={(e) => setNewConfidence(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="High">High Confidence</option>
                <option value="Moderate">Moderate Confidence</option>
                <option value="Low">Low Confidence</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Clinical reasoning or justification..."
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleAdd}>
                Confirm Addition
              </Button>
            </div>
          </div>
        )}

        {/* Diagnosis list */}
        {diagnoses.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No differential diagnoses proposed.
          </div>
        ) : (
          diagnoses.map((diag, idx) => {
            const isAccepted = diag.status === 'ACCEPTED';
            const isRejected = diag.status === 'REJECTED';

            return (
              <div
                key={diag.id || idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isAccepted
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : isRejected
                    ? 'bg-rose-50/40 border-rose-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">
                        {isAccepted ? 'Confirmed Diagnosis: ' : 'Suggested Diagnosis: '}
                        {diag.condition}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isAccepted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isAccepted ? 'Doctor Confirmed' : isRejected ? 'Rejected' : 'Suggested Diagnosis'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          diag.confidence === 'High'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : diag.confidence === 'Low'
                            ? 'bg-slate-50 text-slate-700 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {diag.confidence} Confidence
                      </span>
                      {diag.source && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Source: {diag.source}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {diag.reason}
                    </p>
                  </div>

                  {/* Actions */}
                  {!readOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStatusChange(idx, isAccepted ? 'SUGGESTED' : 'ACCEPTED')}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          isAccepted
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={isAccepted ? 'Accepted' : 'Accept Diagnosis'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleStatusChange(idx, isRejected ? 'SUGGESTED' : 'REJECTED')}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          isRejected
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={isRejected ? 'Rejected' : 'Reject Diagnosis'}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(idx)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
