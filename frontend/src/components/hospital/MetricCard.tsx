import React from 'react';
import { MetricItem } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface MetricCardProps {
  item: MetricItem;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ item, icon }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {item.title}
          </span>
          {icon && (
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
            {item.value}
          </span>
          {item.change && (
            <span
              className={`text-xs font-medium flex items-center gap-0.5 ${
                item.trend === 'up'
                  ? 'text-emerald-600'
                  : item.trend === 'down'
                  ? 'text-rose-600'
                  : 'text-slate-500'
              }`}
            >
              {item.trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {item.trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {item.trend === 'neutral' && <Minus className="w-3 h-3" />}
              {item.change}
            </span>
          )}
        </div>

        {item.subtitle && (
          <p className="text-[11px] text-slate-400 mt-1">{item.subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};
