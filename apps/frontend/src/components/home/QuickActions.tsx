import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Activity, Building2, TrendingUp } from 'lucide-react';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
}

interface QuickActionsProps {
  isPlatformAdmin?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  isPlatformAdmin = false,
}) => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      icon: Plus,
      label: 'New Project',
      description: 'Create a new project',
      onClick: () => navigate('/projects'),
    },
    ...(isPlatformAdmin ? [{
      icon: Activity,
      label: 'View Activity',
      description: 'See recent changes',
      onClick: () => navigate('/activity'),
    }] : []),
    {
      icon: Building2,
      label: 'Manage Teams',
      description: 'Create and manage teams',
      onClick: () => navigate('/teams'),
    },
    {
      icon: TrendingUp,
      label: 'Settings',
      description: 'Configure preferences',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <div className="card gradient-quick-actions">
      <h2 className="text-h3 font-semibold text-theme-primary mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="group flex items-center p-4 rounded-xl border border-theme-subtle text-left transition-all duration-150 card hover:border-theme-default"
            >
              <div className="p-2 rounded-xl mr-4 transition-all duration-150 bg-elevation-1 text-theme-tertiary group-hover:bg-accent-primary-glow group-hover:text-accent-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-theme-primary text-body-sm">{action.label}</p>
                <p className="text-caption text-theme-secondary">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

