import React from 'react';
import { Metric } from '../types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  metric: Metric;
}

const StatCard: React.FC<StatCardProps> = ({ metric }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm transition-all duration-200 hover:border-slate-300">
      <div className="flex justify-between items-start mb-2">
        <p className="text-slate-500 text-sm font-medium">{metric.label}</p>
        <metric.icon className="w-5 h-5 text-slate-400" />
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{metric.value}</h3>
      </div>

      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${
            metric.trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
            {metric.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(metric.trend)}%</span>
        </div>
        <p className="text-xs text-slate-500">{metric.trendLabel}</p>
      </div>
    </div>
  );
};

export default StatCard;