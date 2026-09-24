import React, { useState, useEffect } from 'react';
import { auditApi } from '@/api/client';
import { AuditLog } from '@/types';
import {
  FileCheck2,
  Calendar,
  Clock,
  User,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string>('');

  const fetchLogs = () => {
    setLoading(true);
    auditApi
      .getLogs(selectedAction || undefined)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('CREATED')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (action.includes('REJECTED')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (action.includes('EDITED') || action.includes('DRAFT')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (action.includes('LOGIN')) {
      return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-brand-600" />
            Audit Trail & Compliance Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable chronological logging of all clinical actions, AI draft generations, and doctor sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            icon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 text-xs">
        <span className="font-semibold text-slate-600">Filter Event Action:</span>
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
        >
          <option value="">All Events ({logs.length})</option>
          <option value="DOCTOR_APPROVED">DOCTOR_APPROVED</option>
          <option value="AI_DRAFT_GENERATED">AI_DRAFT_GENERATED</option>
          <option value="CONSULTATION_STARTED">CONSULTATION_STARTED</option>
          <option value="TRANSCRIPT_GENERATED">TRANSCRIPT_GENERATED</option>
          <option value="DOCTOR_EDITED_RECORD">DOCTOR_EDITED_RECORD</option>
          <option value="DOCTOR_LOGIN">DOCTOR_LOGIN</option>
          <option value="HOSPITAL_RECORD_CREATED">HOSPITAL_RECORD_CREATED</option>
        </select>
      </div>

      {/* Visual Timeline Card */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No audit logs found for this filter.</div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-brand-500 group-hover:scale-125 transition-transform" />

                  <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-md border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        {log.target_id && (
                          <span className="font-mono text-xs text-slate-500">ID: {log.target_id}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                      {log.details || 'Action completed by system or authenticated user.'}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Actor: <strong className="text-slate-600">{log.actor_name || 'System'}</strong> (
                        {log.actor_role || 'SYSTEM'})
                      </span>
                      {log.target_entity && <span>Entity: {log.target_entity}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
