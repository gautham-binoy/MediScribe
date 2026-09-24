import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  PlusCircle,
  Building2,
  FileCheck2,
  Settings,
  LogOut,
  Stethoscope,
  ShieldAlert,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'HOSPITAL_ADMIN';

  const adminNavItems = [
    { label: 'Admin Dashboard', path: '/admin', icon: Shield },
    { label: 'Patient Registry', path: '/patients', icon: Users },
    { label: 'Hospital Analytics', path: '/hospital', icon: Building2 },
    { label: 'Audit Timeline', path: '/audit', icon: FileCheck2 },
    { label: 'AI Configuration', path: '/settings', icon: Settings },
  ];

  const doctorNavItems = [
    { label: 'Doctor Dashboard', path: '/dashboard', icon: Activity },
    { label: 'Start Consultation', path: '/consultations/new', icon: PlusCircle, highlight: true },
    { label: 'Patient Directory', path: '/patients', icon: Users },
    { label: 'Hospital Overview', path: '/hospital', icon: Building2 },
    { label: 'Audit Timeline', path: '/audit', icon: FileCheck2 },
    { label: 'AI Configuration', path: '/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : doctorNavItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 selection:bg-brand-500">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-tight leading-none flex items-center gap-1.5">
            MediScribe <span className="text-brand-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">AI</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {isAdmin ? 'Hospital Administration' : 'Clinical Copilot'}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          {isAdmin ? 'Administration' : 'Clinical Operations'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  (item as any).highlight && !isActive
                    ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20 hover:bg-brand-600/20'
                    : isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Safety Boundary Notice */}
        <div className="pt-4 px-2">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-400 leading-relaxed">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {isAdmin ? 'Administrator Access' : 'Physician Oversight'}
            </div>
            {isAdmin
              ? 'Full hospital management access. All changes are logged in the audit trail.'
              : 'AI suggestions are non-autonomous drafts. Every prescription & diagnosis requires explicit physician approval.'}
          </div>
        </div>
      </nav>


      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {user?.full_name?.charAt(0) || 'D'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user?.full_name || 'Medical Officer'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.role === 'HOSPITAL_ADMIN' ? 'Hospital Director' : 'Attending Physician'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
