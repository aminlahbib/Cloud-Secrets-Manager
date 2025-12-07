import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Activity, Building2, TrendingUp } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

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
  const { t } = useI18n();

  const actions: QuickAction[] = [
    {
      icon: Plus,
      label: t('quickActions.newProject.label'),
      description: t('quickActions.newProject.description'),
      onClick: () => navigate('/projects'),
    },
    ...(isPlatformAdmin ? [{
      icon: Activity,
      label: t('quickActions.viewActivity.label'),
      description: t('quickActions.viewActivity.description'),
      onClick: () => navigate('/activity'),
    }] : []),
    {
      icon: Building2,
      label: t('quickActions.manageTeams.label'),
      description: t('quickActions.manageTeams.description'),
      onClick: () => navigate('/teams'),
    },
    {
      icon: TrendingUp,
      label: t('quickActions.settings.label'),
      description: t('quickActions.settings.description'),
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <div className="card">
      <div className="padding-card border-b border-theme-subtle">
        <h2 className="text-body font-semibold text-theme-primary">{t('quickActions.shortcuts')}</h2>
      </div>
      <div className="padding-card space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="group w-full flex items-center gap-3 p-3 rounded-lg hover:bg-elevation-1 text-left transition-colors"
            >
              <div className="p-2 rounded-md bg-elevation-1 text-theme-tertiary group-hover:bg-accent-primary-glow group-hover:text-accent-primary transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-theme-primary group-hover:text-accent-primary transition-colors">
                  {action.label}
                </p>
                <p className="text-caption text-theme-secondary truncate">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

