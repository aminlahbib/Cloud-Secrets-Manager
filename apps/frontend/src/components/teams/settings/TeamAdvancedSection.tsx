import React from 'react';
import { Trash2, UserCog } from 'lucide-react';
import { Button } from '../../ui/Button';
import { FormSection } from '../../ui/FormSection';
import { useI18n } from '../../../contexts/I18nContext';

interface TeamAdvancedSectionProps {
  canDeleteTeam: boolean;
  canTransferOwnership: boolean;
  onTransferOwnership: () => void;
  onDeleteTeam: () => void;
}

export const TeamAdvancedSection: React.FC<TeamAdvancedSectionProps> = ({
  canDeleteTeam,
  canTransferOwnership,
  onTransferOwnership,
  onDeleteTeam,
}) => {
  const { t } = useI18n();
  
  return (
    <FormSection
      variant="card"
      title={t('teamDetail.settings.advanced')}
      description={t('teamDetail.settings.advancedDescription')}
      className="rounded-3xl"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {canTransferOwnership && (
          <Button variant="secondary" onClick={onTransferOwnership}>
            <UserCog className="w-4 h-4 mr-2" />
            {t('projectAdvanced.transferOwnership')}
          </Button>
        )}
        {canDeleteTeam && (
          <Button variant="danger" onClick={onDeleteTeam}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('teamDetail.settings.deleteTeam')}
          </Button>
        )}
      </div>
    </FormSection>
  );
};

