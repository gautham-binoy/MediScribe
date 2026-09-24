import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  PlusCircle,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { consultationsApi, patientsApi } from '@/api/client';
import { Consultation, Patient } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      consultationsApi.getAll(),
      patientsApi.getAll(),
    ])
      .then(([cList, pList]) => {
        setConsultations(cList);
        setPatients(pList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = consultations.filter((c) => c.status === 'PENDING_REVIEW').length;
  const approvedCount = consultations.filter((c) => c.status === 'APPROVED').length;

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome, {user?.full_name || 'Doctor'}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Active Shift
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical Documentation & Decision Support Workspace • All AI outputs require explicit approval.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/consultations/new')}
            icon={<PlusCircle className="w-4 h-4" />}
            className="shadow-sm shadow-brand-500/20"
          >
            Start New Consultation
          </Button>
        </div>
      </div>

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Doctor Review
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2">{pendingCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">AI drafts awaiting physician approval</p>
        </Card>

        <Card className="p-4 border-slate-200 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved Medical Records
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">{approvedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Finalized & digitally signed records</p>
        </Card>

        <Card className="p-4 border-slate-200 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Patients
            </span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-2">{patients.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Synthetic patient directory</p>
        </Card>

        <Card className="p-4 border-brand-200 bg-gradient-to-br from-brand-50/50 to-white hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-800 uppercase tracking-wider">
              Multilingual Engine
            </span>
            <Sparkles className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-sm font-bold text-brand-900 mt-2">English + മലയാളം</div>
          <p className="text-[11px] text-brand-700 mt-1">Bilingual code-switching enabled</p>
        </Card>
      </div>

      {/* Main Grid: Recent Consultations & Patient Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Consultations List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              Recent Consultations
            </h2>
            <span className="text-xs text-slate-400">{consultations.length} total encounters</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading consultations...</div>
          ) : consultations.length === 0 ? (
            <Card className="p-8 text-center text-slate-400 text-xs">
              No consultations recorded yet. Click "Start New Consultation" to begin.
            </Card>
          ) : (
            <div className="space-y-3">
              {consultations.slice(0, 6).map((c) => {
                const isPending = c.status === 'PENDING_REVIEW' || c.status === 'AI_DRAFT';
                return (
                  <Card
                    key={c.id}
                    className="p-4 hover:border-slate-300 transition-all flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-[240px]">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-700 shrink-0">
                        {c.patient?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {c.patient?.name || 'Patient'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600">
                            {c.patient?.patient_id || 'ID'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{c.consultation_id}</span>
                          <span>•</span>
                          <span>{c.detected_language}</span>
                          <span>•</span>
                          <span>{new Date(c.started_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={c.status} />

                      {isPending ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => navigate(`/consultations/${c.id}/review`)}
                          icon={<Stethoscope className="w-3.5 h-3.5" />}
                        >
                          Review & Sign
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/consultations/${c.id}/review`)}
                          icon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          View Record
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Patient Directory (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              Patient Roster
            </h2>
            <button
              onClick={() => navigate('/patients')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View All
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name or P1001..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-2">
            {filteredPatients.slice(0, 5).map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/consultations/new?patient_id=${p.patient_id}`)}
                className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-brand-300 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{p.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {p.patient_id} • {p.age}y • {p.gender}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-brand-600 font-semibold block">Start Visit</span>
                  <span className="text-[10px] text-slate-400">{p.blood_group || 'O+'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
