import React from 'react';
import { FormSection } from '../../ui/FormSection';
import { useI18n } from '../../../contexts/I18nContext';

interface ProjectOverviewSectionProps {
  metaPairs: Array<{ label: string; value: string | number }>;
  isArchived: boolean;
}

export const ProjectOverviewSection: React.FC<ProjectOverviewSectionProps> = ({
  metaPairs,
  isArchived,
}) => {
  const { t } = useI18n();
  return (
    <FormSection
      variant="default"
      title={t('projectDetail.settings.overview')}
    >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metaPairs.map((item) => (
            <div key={item.label} className="rounded-2xl border border-theme-subtle p-4 bg-elevation-1">
              <p className="text-xs uppercase tracking-[0.2em] text-theme-tertiary">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-theme-primary">{item.value}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-theme-subtle p-4 bg-elevation-1">
            <p className="text-xs uppercase tracking-[0.2em] text-theme-tertiary">{t('projectDetail.settings.status')}</p>
            <p className="mt-2 text-lg font-semibold text-theme-primary">
              {isArchived ? t('projectDetail.settings.statusArchived') : t('projectDetail.settings.statusActive')}
            </p>
          </div>
        </div>
    </FormSection>
  );
};

