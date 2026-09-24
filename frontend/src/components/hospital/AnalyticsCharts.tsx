import React from 'react';
import { TrendPoint, StatusDistributionItem } from '@/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';

interface AnalyticsChartsProps {
  trends: TrendPoint[];
  statusDistribution: StatusDistributionItem[];
  aiRatio: number;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  trends,
  statusDistribution,
  aiRatio,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 7-day Consultations Trend */}
      <Card className="lg:col-span-2">
        <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            CONSULTATIONS & APPROVAL VELOCITY (LAST 7 DAYS)
          </CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-brand-700">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span> Total
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Approved
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="approvedColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="consultations"
                  name="Total Consultations"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#totalColor)"
                />
                <Area
                  type="monotone"
                  dataKey="approved"
                  name="Approved Records"
                  stroke="#047857"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#approvedColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown & AI Adoption Gauge */}
      <Card>
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-brand-600" />
            WORKFLOW STATUS BREAKDOWN
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-2 space-y-4">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusDistribution}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Documentation Adoption Progress Bar */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700">AI Draft Adoption Rate</span>
              <span className="font-bold text-brand-600 font-mono">{aiRatio}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-teal-400 rounded-full"
                style={{ width: `${Math.min(aiRatio, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Goal: 90%</span>
              <span>100% Physician Reviewed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
