import React from 'react';
import { Folder, Key, Users, Building2, LucideIcon } from 'lucide-react';

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
    <div className="flex items-center gap-6 md:gap-8 py-4 border-b border-theme-subtle">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-elevation-1 text-theme-tertiary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-theme-tertiary uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-lg font-bold text-theme-primary tabular-nums">
                {stat.isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-theme-subtle border-t-accent-primary rounded-full animate-spin" />
                ) : (
                  stat.value
                )}
              </p>
            </div>
            {index < stats.length - 1 && (
              <div className="hidden md:block w-px h-8 bg-theme-subtle ml-2" />
            )}
          </div>
        );
      })}
    </div>
  );
};

