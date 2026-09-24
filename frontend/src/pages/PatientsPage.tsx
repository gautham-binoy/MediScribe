import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Plus, Stethoscope, ArrowRight, ShieldCheck, Phone, AlertTriangle } from 'lucide-react';
import { patientsApi } from '@/api/client';
import { Patient } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New patient state
  const [newPatient, setNewPatient] = useState({
    patient_id: '',
    name: '',
    dob: '1998-05-20',
    age: 28,
    gender: 'Male',
    phone: '+91 ',
    email: '',
    blood_group: 'O+',
    allergies: 'No known drug allergies (NKDA)',
    existing_conditions: 'None',
    current_medications: 'None',
  });

  const fetchPatients = () => {
    setLoading(true);
    patientsApi
      .getAll(search)
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.patient_id.trim() || !newPatient.name.trim()) return;

    try {
      const payload: any = {
        ...newPatient,
        email: newPatient.email && newPatient.email.trim() ? newPatient.email.trim() : undefined,
      };
      await patientsApi.create(payload);
      success('Patient Registered', `${newPatient.name} (${newPatient.patient_id}) added.`);
      setShowCreateModal(false);
      fetchPatients();
    } catch (err: any) {
      toastError('Registration Failed', err.message || 'Could not register patient');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Patient Directory & Clinical History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered synthetic patient profiles with longitudinal medical consultation history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setNewPatient((prev) => ({
                ...prev,
                patient_id: `P${Math.floor(1000 + Math.random() * 9000)}`,
              }));
              setShowCreateModal(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add New Patient
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient name, ID (e.g. P1001), or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Patients Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="p-4">Patient ID</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Demographics</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Allergies & Conditions</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading patient directory...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No matching patients found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{p.patient_id}</td>
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-xs">
                        {p.name.charAt(0)}
                      </div>
                      {p.name}
                    </td>
                    <td className="p-4 text-slate-600">
                      {p.age} yrs • {p.gender} {p.blood_group && `• ${p.blood_group}`}
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1 font-mono">{p.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          {p.allergies || 'NKDA'}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-xs">
                          {p.existing_conditions || 'None'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/patients/${p.patient_id}`)}
                      >
                        Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(`/consultations/new?patient_id=${p.patient_id}`)}
                        icon={<Stethoscope className="w-3.5 h-3.5" />}
                      >
                        Start Visit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create Patient Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register Synthetic Patient"
        description="Add a new educational patient profile for clinical documentation testing."
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePatient} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Patient ID</label>
              <input
                type="text"
                required
                value={newPatient.patient_id}
                onChange={(e) => setNewPatient({ ...newPatient, patient_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                placeholder="e.g. Suresh Kumar"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                required
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={newPatient.gender}
                onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={newPatient.blood_group}
                onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              >
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                required
                value={newPatient.phone}
                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </label>
              <input
                type="email"
                value={newPatient.email}
                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                placeholder="patient@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Allergies</label>
            <input
              type="text"
              value={newPatient.allergies}
              onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-amber-800"
              placeholder="e.g. Penicillin / NKDA"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Existing Conditions</label>
            <input
              type="text"
              value={newPatient.existing_conditions}
              onChange={(e) => setNewPatient({ ...newPatient, existing_conditions: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              placeholder="e.g. Hypertension / Asthma"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button size="md" variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button size="md" variant="primary" type="submit">
              Register Patient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
