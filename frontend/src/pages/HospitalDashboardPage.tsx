import React, { useState, useEffect } from 'react';
import { hospitalApi } from '@/api/client';
import { HospitalDashboardData } from '@/types';
import { Building2, Users, Clock, CheckCircle2, ShieldCheck, Sparkles, Activity } from 'lucide-react';
import { MetricCard } from '@/components/hospital/MetricCard';
import { AnalyticsCharts } from '@/components/hospital/AnalyticsCharts';
import { PatientHistoryModal } from '@/components/hospital/PatientHistoryModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const HospitalDashboardPage: React.FC = () => {
  const [data, setData] = useState<HospitalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    hospitalApi
      .getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        Loading hospital analytics and clinical operations dashboard...
      </div>
    );
  }

  const { metrics, consultation_trends, status_distribution, ai_assisted_ratio, recent_patients } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            Hospital Administration & Quality Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time outpatient flow, physician documentation throughput, and electronic health record governance.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-700 font-semibold border border-slate-200">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Hospital Operations Normal</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.total_patients && (
          <MetricCard item={metrics.total_patients} icon={<Users className="w-4 h-4 text-brand-600" />} />
        )}
        {metrics.today_consultations && (
          <MetricCard item={metrics.today_consultations} icon={<Clock className="w-4 h-4 text-blue-600" />} />
        )}
        {metrics.pending_approvals && (
          <MetricCard item={metrics.pending_approvals} icon={<Clock className="w-4 h-4 text-amber-600" />} />
        )}
        {metrics.approved_records && (
          <MetricCard item={metrics.approved_records} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
        )}
        {metrics.ai_assisted && (
          <MetricCard item={metrics.ai_assisted} icon={<Sparkles className="w-4 h-4 text-purple-600" />} />
        )}
      </div>

      {/* Interactive Charts Component */}
      <AnalyticsCharts
        trends={consultation_trends}
        statusDistribution={status_distribution}
        aiRatio={ai_assisted_ratio}
      />

      {/* Recent Patients with Medical History Modal trigger */}
      <Card>
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800">
            RECENT OUTPATIENTS & APPROVED MEDICAL RECORDS
          </CardTitle>
          <span className="text-xs text-slate-400">
            Click any patient row to inspect certified electronic health records
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="p-4">Patient ID</th>
                <th className="p-4">Patient Name</th>
                <th className="p-4">Attending Doctor</th>
                <th className="p-4">Latest Consultation</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Medical History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {recent_patients.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.patient_id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-mono font-bold text-slate-900">{p.patient_id}</td>
                  <td className="p-4 font-semibold text-slate-900">
                    {p.name}{' '}
                    <span className="text-slate-400 font-normal">
                      ({p.age}y, {p.gender})
                    </span>
                  </td>
                  <td className="p-4 text-slate-700">{p.doctor_name || 'OPD Attending'}</td>
                  <td className="p-4 text-slate-500 font-mono">
                    {p.last_consultation_date
                      ? new Date(p.last_consultation_date).toLocaleDateString()
                      : 'No visits'}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatientId(p.patient_id);
                      }}
                      className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:text-brand-600 hover:border-brand-300 bg-white font-medium text-xs transition-colors"
                    >
                      Inspect History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Patient History Modal */}
      <PatientHistoryModal
        patientId={selectedPatientId}
        isOpen={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />
    </div>
  );
};
