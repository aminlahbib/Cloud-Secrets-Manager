import React from 'react';
import { FormSection } from '../../ui/FormSection';
import { useI18n } from '../../../contexts/I18nContext';
import type { Team } from '../../../types';

interface TeamGeneralSettingsSectionProps {
  team: Team;
}

export const TeamGeneralSettingsSection: React.FC<TeamGeneralSettingsSectionProps> = ({
  team,
}) => {
  const { t } = useI18n();
  return (
    <FormSection
      variant="card"
      title={t('teamDetail.settings.general')}
      className="rounded-3xl"
    >
      <div className="max-w-2xl space-y-4">
        <div>
          <label className="block text-body-sm font-medium mb-2 text-theme-secondary">{t('teamDetail.settings.teamName')}</label>
          <div className="input-theme px-4 py-2 rounded-xl bg-elevation-1">
            <p className="text-theme-primary">{team.name}</p>
          </div>
          <p className="mt-1 text-caption text-theme-tertiary">
            {t('teamDetail.settings.teamNameHint')}
          </p>
        </div>

        {team.description && (
          <div>
            <label className="block text-body-sm font-medium mb-2 text-theme-secondary">{t('teamDetail.settings.description')}</label>
            <div className="input-theme px-4 py-3 rounded-xl bg-elevation-1 whitespace-pre-wrap">
              <p className="text-theme-primary">{team.description}</p>
            </div>
            <p className="mt-1 text-caption text-theme-tertiary">
              {t('teamDetail.settings.descriptionHint')}
            </p>
          </div>
        )}
      </div>
    </FormSection>
  );
};

