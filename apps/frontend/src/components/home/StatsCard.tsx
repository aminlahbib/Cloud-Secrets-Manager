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
    <div className="card group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-sm font-medium text-theme-secondary">{label}</p>
          <p className="text-h1 font-semibold text-theme-primary mt-1">
            {isLoading ? '...' : value}
          </p>
        </div>
        <div className="p-3 rounded-2xl border border-theme-subtle text-theme-tertiary transition-all duration-150 hover:border-theme-accent hover:text-accent-primary hover:bg-accent-primary-glow">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

