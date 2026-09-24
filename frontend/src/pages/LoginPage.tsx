import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, Lock, Mail, ShieldCheck, Sparkles, Building2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('doctor@demo.com');
  const [password, setPassword] = useState('doctor123');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);
      success('Logged in successfully', `Welcome back to MediScribe AI.`);
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        // Use the actual role from the backend response
        const dest = loggedInUser.role === 'HOSPITAL_ADMIN' ? '/admin' : '/dashboard';
        navigate(dest, { replace: true });
      }
    } catch (err: any) {
      toastError('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (role: 'doctor' | 'admin') => {
    if (role === 'doctor') {
      setEmail('doctor@demo.com');
      setPassword('doctor123');
    } else {
      setEmail('admin@demo.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-brand-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 items-center justify-center text-white shadow-xl shadow-brand-500/20 mb-4">
          <Stethoscope className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          MediScribe <span className="text-brand-400">AI</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Clinical Documentation & Hospital Management Copilot
        </p>

        {/* Demo Mode Badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Educational Prototype • Demo Mode Active</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-md">
          {/* Quick 1-Click Demo Login */}
          <div className="mb-6 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 text-xs text-slate-300 space-y-2">
            <span className="font-semibold text-slate-200 block text-[11px] uppercase tracking-wider">
              1-Click Demo Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('doctor')}
                className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 ${
                  email === 'doctor@demo.com'
                    ? 'border-brand-500 bg-brand-500/10 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-brand-400 shrink-0" />
                <div>
                  <div className="font-bold text-white text-[11px]">Doctor Account</div>
                  <div className="text-[10px] text-slate-400 font-mono">doctor@demo.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 ${
                  email === 'admin@demo.com'
                    ? 'border-teal-500 bg-teal-500/10 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <div className="font-bold text-white text-[11px]">Hospital Admin</div>
                  <div className="text-[10px] text-slate-400 font-mono">admin@demo.com</div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="doctor@demo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-semibold shadow-lg shadow-brand-600/30"
              isLoading={isLoading}
            >
              Sign In to MediScribe AI
            </Button>
          </form>

          {/* Safety disclaimer */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center text-[11px] text-slate-400 leading-relaxed flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span>Physician-in-the-loop AI • Synthetic patient records only</span>
          </div>
        </div>
      </div>
    </div>
  );
};
