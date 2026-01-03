import React from 'react';
import { FormSection } from '../../ui/FormSection';
import { useI18n } from '../../../contexts/I18nContext';
import type { Team } from '../../../types';

interface TeamOverviewSectionProps {
  team: Team;
  memberCount?: number;
  projectCount?: number;
}

export const TeamOverviewSection: React.FC<TeamOverviewSectionProps> = ({
  team,
  memberCount,
  projectCount,
}) => {
  const { t } = useI18n();
  const metaPairs = [
    { label: t('teamDetail.settings.membersLabel'), value: memberCount ?? team.memberCount ?? 0 },
    { label: t('teamDetail.settings.projects'), value: projectCount ?? team.projectCount ?? 0 },
    { label: t('teamDetail.settings.created'), value: new Date(team.createdAt).toLocaleDateString() },
  ];

  return (
    <FormSection
      variant="card"
      title={t('teamDetail.settings.overview')}
      className="rounded-3xl"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metaPairs.map((item) => (
          <div key={item.label} className="rounded-2xl border border-theme-subtle p-4 bg-elevation-1">
            <p className="text-xs uppercase tracking-[0.2em] text-theme-tertiary">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-theme-primary">{item.value}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-theme-subtle p-4 bg-elevation-1">
          <p className="text-xs uppercase tracking-[0.2em] text-theme-tertiary">{t('teamDetail.settings.status')}</p>
          <p className="mt-2 text-lg font-semibold text-theme-primary">{t('teamDetail.settings.statusActive')}</p>
        </div>
      </div>
    </FormSection>
  );
};

