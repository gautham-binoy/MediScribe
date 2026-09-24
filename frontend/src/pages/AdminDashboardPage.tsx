import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  UserPlus,
  Building2,
  Activity,
  Plus,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Stethoscope,
  ClipboardList,
  Eye,
  EyeOff,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { adminApi, patientsApi, consultationsApi } from '@/api/client';
import { User, Patient } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}> = ({ label, value, sub, icon, color = 'brand' }) => {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <Card className="p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultationCount, setConsultationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'patients'>('overview');

  // Modals
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // New user form
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: 'doctor123',
    role: 'DOCTOR',
    department: 'General Medicine',
  });

  // New patient form
  const [newPatient, setNewPatient] = useState({
    patient_id: '',
    name: '',
    dob: '1990-01-01',
    age: 34,
    gender: 'Male',
    phone: '+91 ',
    email: '',
    blood_group: 'O+',
    allergies: 'No known drug allergies (NKDA)',
    existing_conditions: 'None',
    current_medications: 'None',
    address: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, patientsData, consultationsData] = await Promise.all([
        adminApi.getUsers(),
        patientsApi.getAll(),
        consultationsApi.getAll(),
      ]);
      setUsers(usersData);
      setPatients(patientsData);
      setConsultationCount(consultationsData.length);
    } catch (err: any) {
      toastError('Load Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.full_name) return;
    try {
      await adminApi.createUser(newUser);
      success('Staff Registered', `${newUser.full_name} account created.`);
      setShowAddUser(false);
      setNewUser({ full_name: '', email: '', password: 'doctor123', role: 'DOCTOR', department: 'General Medicine' });
      fetchData();
    } catch (err: any) {
      toastError('Registration Failed', err.message);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.patient_id || !newPatient.name) return;
    try {
      await adminApi.createPatient(newPatient);
      success('Patient Registered', `${newPatient.name} (${newPatient.patient_id}) added.`);
      setShowAddPatient(false);
      setNewPatient({ patient_id: '', name: '', dob: '1990-01-01', age: 34, gender: 'Male', phone: '+91 ', email: '', blood_group: 'O+', allergies: 'No known drug allergies (NKDA)', existing_conditions: 'None', current_medications: 'None', address: '' });
      fetchData();
    } catch (err: any) {
      toastError('Registration Failed', err.message);
    }
  };

  const handleToggleUser = async (u: User) => {
    try {
      if (u.is_active ?? true) {
        await adminApi.deactivateUser(u.id);
        success('Account Deactivated', `${u.full_name}'s access has been revoked.`);
      } else {
        await adminApi.activateUser(u.id);
        success('Account Activated', `${u.full_name}'s access has been restored.`);
      }
      fetchData();
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  const doctors = users.filter((u) => u.role === 'DOCTOR');
  const admins = users.filter((u) => u.role === 'HOSPITAL_ADMIN');

  const inputCls = 'w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';
  const labelCls = 'block text-[11px] font-semibold text-slate-600 mb-1';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-brand-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Hospital Administration
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Welcome, {user?.full_name} · Hospital Director
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddPatient(true)}
            icon={<UserPlus className="w-4 h-4" />}
            className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-400"
          >
            Register Patient
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddUser(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Staff
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={patients.length} sub="Registered in system" icon={<Users className="w-5 h-5" />} color="brand" />
        <StatCard label="Total Consultations" value={consultationCount} sub="All time encounters" icon={<ClipboardList className="w-5 h-5" />} color="emerald" />
        <StatCard label="Doctors on Staff" value={doctors.length} sub="Active physicians" icon={<Stethoscope className="w-5 h-5" />} color="purple" />
        <StatCard label="Admin Accounts" value={admins.length} sub="Hospital directors" icon={<Shield className="w-5 h-5" />} color="amber" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['overview', 'staff', 'patients'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'staff' ? 'Staff Management' : 'Patient Registry'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Patients */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" />
                Recent Patients
              </h2>
              <button onClick={() => setActiveTab('patients')} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-xs text-slate-400 py-4 text-center">Loading...</div>
              ) : patients.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/patients/${p.patient_id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-teal-100 flex items-center justify-center text-xs font-bold text-brand-700">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{p.patient_id} · {p.age}y · {p.gender}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">{p.blood_group}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Staff List */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                Staff Accounts
              </h2>
              <button onClick={() => setActiveTab('staff')} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-xs text-slate-400 py-4 text-center">Loading...</div>
              ) : users.slice(0, 6).map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.role === 'HOSPITAL_ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                      {u.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{u.full_name}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.role === 'HOSPITAL_ADMIN' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                    {u.role === 'HOSPITAL_ADMIN' ? 'Admin' : 'Doctor'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── STAFF MANAGEMENT TAB ─────────────────────────────────── */}
      {activeTab === 'staff' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-600" />
              Staff Management ({users.length} accounts)
            </h2>
            <Button variant="primary" size="sm" onClick={() => setShowAddUser(true)} icon={<Plus className="w-4 h-4" />}>
              Add Staff Member
            </Button>
          </div>

          {loading ? (
            <div className="text-xs text-slate-400 py-8 text-center">Loading staff...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="text-left pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="text-left pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-left pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                    <th className="text-left pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${u.role === 'HOSPITAL_ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                            {u.full_name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-500">{u.email}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.role === 'HOSPITAL_ADMIN' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                          {u.role === 'HOSPITAL_ADMIN' ? '🏥 Admin' : '⚕️ Doctor'}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">{u.department || 'General Medicine'}</td>
                      <td className="py-3.5">
                        <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold ${(u as any).is_active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {(u as any).is_active !== false ? <><CheckCircle2 className="w-3 h-3" />Active</> : <><XCircle className="w-3 h-3" />Inactive</>}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleToggleUser(u)}
                            className={`flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${(u as any).is_active !== false ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          >
                            {(u as any).is_active !== false ? <><UserX className="w-3 h-3" />Deactivate</> : <><UserCheck className="w-3 h-3" />Activate</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── PATIENT REGISTRY TAB ─────────────────────────────────── */}
      {activeTab === 'patients' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              Patient Registry ({patients.length} patients)
            </h2>
            <Button variant="primary" size="sm" onClick={() => setShowAddPatient(true)} icon={<UserPlus className="w-4 h-4" />}>
              Register New Patient
            </Button>
          </div>

          {loading ? (
            <div className="text-xs text-slate-400 py-8 text-center">Loading patients...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="text-left pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="text-left pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Age / Gender</th>
                    <th className="text-left pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Blood Group</th>
                    <th className="text-left pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Allergies</th>
                    <th className="text-right pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-100 to-teal-100 flex items-center justify-center text-[11px] font-bold text-brand-700">
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-slate-600">{p.patient_id}</td>
                      <td className="py-3.5 text-slate-500">{p.age}y · {p.gender}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-semibold">{p.blood_group || 'N/A'}</span>
                      </td>
                      <td className="py-3.5 text-slate-500 max-w-[200px] truncate">
                        {p.allergies?.toLowerCase().includes('nkda') || p.allergies?.toLowerCase().includes('no known') ? (
                          <span className="text-emerald-600 font-semibold">NKDA</span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {p.allergies}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/patients/${p.patient_id}`)}
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => navigate(`/consultations/new?patient_id=${p.patient_id}`)}
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Stethoscope className="w-3 h-3" /> Consult
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── ADD STAFF MODAL ──────────────────────────────────────── */}
      <Modal isOpen={showAddUser} onClose={() => setShowAddUser(false)} title="Register New Staff Member">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input className={inputCls} value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="Dr. Anjali Menon" required />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" className={inputCls} value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="doctor@hospital.com" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Role *</label>
              <select className={inputCls} value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="DOCTOR">Doctor</option>
                <option value="HOSPITAL_ADMIN">Hospital Admin</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Department</label>
              <select className={inputCls} value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}>
                {['General Medicine', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'ENT', 'Ophthalmology', 'Gynecology', 'Psychiatry', 'Emergency Medicine'].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Temporary Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={inputCls + ' pr-9'}
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" icon={<UserPlus className="w-4 h-4" />}>Register Staff</Button>
          </div>
        </form>
      </Modal>

      {/* ── ADD PATIENT MODAL ────────────────────────────────────── */}
      <Modal isOpen={showAddPatient} onClose={() => setShowAddPatient(false)} title="Register New Patient">
        <form onSubmit={handleCreatePatient} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Patient ID *</label>
              <input className={inputCls} value={newPatient.patient_id} onChange={(e) => setNewPatient({ ...newPatient, patient_id: e.target.value })} placeholder="P2001" required />
            </div>
            <div>
              <label className={labelCls}>Full Name *</label>
              <input className={inputCls} value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} placeholder="Arun Krishnan" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input type="date" className={inputCls} value={newPatient.dob} onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Age</label>
              <input type="number" className={inputCls} value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) })} min={0} max={130} />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select className={inputCls} value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} placeholder="+91 98460 XXXXX" />
            </div>
            <div>
              <label className={labelCls}>Blood Group</label>
              <select className={inputCls} value={newPatient.blood_group} onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => <option key={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Drug Allergies</label>
            <input className={inputCls} value={newPatient.allergies} onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })} placeholder="NKDA or list allergies" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Existing Conditions</label>
              <input className={inputCls} value={newPatient.existing_conditions} onChange={(e) => setNewPatient({ ...newPatient, existing_conditions: e.target.value })} placeholder="Diabetes, Hypertension..." />
            </div>
            <div>
              <label className={labelCls}>Current Medications</label>
              <input className={inputCls} value={newPatient.current_medications} onChange={(e) => setNewPatient({ ...newPatient, current_medications: e.target.value })} placeholder="Metformin 500mg..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowAddPatient(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" icon={<UserPlus className="w-4 h-4" />}>Register Patient</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
