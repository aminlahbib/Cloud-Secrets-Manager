import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  isLoading?: boolean;
}

interface StatsStripProps {
  stats: StatItem[];
}

export const StatsStrip: React.FC<StatsStripProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index} 
            className="card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-theme-tertiary uppercase tracking-wide">
                {stat.label}
              </p>
              <div className="p-1.5 rounded-md bg-elevation-1 text-theme-tertiary">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-theme-primary tabular-nums">
              {stat.isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-theme-subtle border-t-accent-primary rounded-full animate-spin" />
              ) : (
                stat.value
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
};

