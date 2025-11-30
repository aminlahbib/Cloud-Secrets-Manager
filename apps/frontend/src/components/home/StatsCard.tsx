import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  isLoading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon: Icon,
  isLoading = false,
}) => {
  return (
    <div className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium text-theme-secondary mb-1.5">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-theme-primary tabular-nums">
            {isLoading ? (
              <span className="inline-block w-8 h-8 border-2 border-theme-subtle border-t-accent-primary rounded-full animate-spin" />
            ) : (
              value
            )}
          </p>
        </div>
        <div className="p-3 md:p-4 rounded-xl bg-elevation-1 border border-theme-subtle text-theme-tertiary transition-all duration-200 group-hover:border-accent-primary group-hover:text-accent-primary group-hover:bg-accent-primary-glow group-hover:scale-110 flex-shrink-0 ml-3">
          <Icon className="h-5 w-5 md:h-6 md:w-6" />
        </div>
      </div>
    </div>
  );
};

