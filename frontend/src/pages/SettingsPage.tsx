import React, { useEffect, useState } from 'react';
import { systemApi } from '@/api/client';
import { AIHealthStatus } from '@/types';
import { Settings, Cpu, ShieldCheck, Sparkles, Database, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const SettingsPage: React.FC = () => {
  const [aiStatus, setAiStatus] = useState<AIHealthStatus | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([systemApi.getAiHealth(), systemApi.getHealth()])
      .then(([ai, sys]) => {
        setAiStatus(ai);
        setSystemHealth(sys);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading system settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          AI Provider & System Diagnostics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspection of LLM endpoints, active safety boundaries, and demo operational readiness.
        </p>
      </div>

      {/* Active AI Provider Overview */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-600" />
              ACTIVE AI PIPELINE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              Operational
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Active Provider</span>
              <span className="font-bold text-sm text-slate-900 capitalize mt-0.5 block">
                {aiStatus?.active_provider} Provider
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Model Identifier</span>
              <span className="font-bold text-sm text-brand-700 font-mono mt-0.5 block">
                {aiStatus?.model_name || 'gemini-2.5-flash'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">RAG Engine</span>
              <span className="font-bold text-sm text-emerald-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {aiStatus?.rag_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Demo Mode</span>
              <span className="font-bold text-sm text-emerald-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {aiStatus?.demo_mode ? 'Active (Offline Safe)' : 'Live API Mode'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-brand-50/50 border border-brand-200 rounded-xl text-xs text-brand-900 leading-relaxed">
            <strong>Safety Protocol:</strong> {aiStatus?.notice}
          </div>
        </CardContent>
      </Card>

      {/* Provider Credentials Status (Never exposing secret values) */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-600" />
            AI PROVIDER CONFIGURATION & EXTENSION POINTS
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 space-y-3">
          <div className="space-y-2 text-xs">
            {/* Gemini */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Google Gemini API (Primary Provider)</div>
                <div className="text-[11px] text-slate-500">
                  Multilingual audio transcription, structured clinical entity extraction, and function calling.
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full font-semibold text-xs ${
                  aiStatus?.credentials.gemini === 'Configured'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {aiStatus?.credentials.gemini}
              </span>
            </div>

            {/* OpenAI */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">OpenAI Provider (Architecture Extension)</div>
                <div className="text-[11px] text-slate-500">
                  Extension point for GPT-4o / Azure OpenAI clinical models.
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full font-semibold text-xs ${
                  aiStatus?.credentials.openai === 'Configured'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {aiStatus?.credentials.openai}
              </span>
            </div>

            {/* Anthropic */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Anthropic Claude (Architecture Extension)</div>
                <div className="text-[11px] text-slate-500">
                  Extension point for Claude 3.5 Sonnet clinical documentation.
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full font-semibold text-xs ${
                  aiStatus?.credentials.anthropic === 'Configured'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {aiStatus?.credentials.anthropic}
              </span>
            </div>

            {/* Mock Provider */}
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-900">Deterministic Mock Provider (Expo Guaranteed)</div>
                <div className="text-[11px] text-emerald-700">
                  High-fidelity offline simulation for Malayalam+English consultation and synthetic test cases.
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full font-semibold text-xs bg-emerald-100 text-emerald-900 border border-emerald-300">
                Always Available
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database & Infrastructure */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-600" />
            INFRASTRUCTURE STATUS
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Database Engine</span>
              <span className="font-bold text-sm text-slate-900 uppercase font-mono mt-0.5 block">
                {systemHealth?.database?.type || 'SQLite (Local Fallback)'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Connection Status</span>
              <span className="font-bold text-sm text-emerald-700 mt-0.5 block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {systemHealth?.database?.status || 'Connected'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Swagger API Docs</span>
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-sm text-brand-600 hover:underline mt-0.5 block"
              >
                Open /docs (FastAPI)
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
