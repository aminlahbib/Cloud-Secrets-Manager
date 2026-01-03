import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { FormSection } from '../../ui/FormSection';
import { Badge } from '../../ui/Badge';
import { useI18n } from '../../../contexts/I18nContext';
import type { ProjectMember } from '../../../types';

interface ProjectAdvancedSectionProps {
  canManageProject: boolean;
  canLeaveProject: boolean;
  isSoleOwner: boolean;
  transferableMembers: ProjectMember[];
  onTransferOwnership: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onLeave: () => void;
  isArchived: boolean;
  isArchiving: boolean;
  isRestoring: boolean;
  isLeaving: boolean;
  secretCount?: number;
}

export const ProjectAdvancedSection: React.FC<ProjectAdvancedSectionProps> = ({
  canManageProject,
  canLeaveProject,
  isSoleOwner,
  transferableMembers,
  onTransferOwnership,
  onArchive,
  onRestore,
  onDelete,
  onLeave,
  isArchived,
  isArchiving,
  isRestoring,
  isLeaving,
  secretCount = 0,
}) => {
  const { t } = useI18n();
  
  if (canManageProject) {
    return (
      <FormSection
        variant="default"
        title={t('projectAdvanced.projectLifecycle')}
        description={t('projectAdvanced.projectLifecycleDescription')}
      >
        {transferableMembers.length > 0 && (
          <div className="flex flex-col gap-3 md:flex-row">
            <Button variant="secondary" className="flex-1" onClick={onTransferOwnership}>
              {t('projectAdvanced.transferOwnership')}
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-3 md:flex-row">
          {!isArchived ? (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onArchive}
                isLoading={isArchiving}
              >
                {t('projectAdvanced.archiveProject')}
              </Button>
              <Button 
                variant="danger" 
                className="flex-1 flex items-center justify-center gap-2" 
                onClick={onDelete}
                title={secretCount > 0 ? t('projectAdvanced.secretCountWarning', { count: secretCount, plural: secretCount !== 1 ? 's' : '' }) : undefined}
              >
                <span>{t('projectAdvanced.deleteProject')}</span>
                {secretCount > 0 && (
                  <Badge 
                    variant="warning" 
                    className="flex items-center gap-1"
                    title={t('projectAdvanced.secretsWillBeDeleted', { count: secretCount, plural: secretCount !== 1 ? 's' : '' })}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {secretCount}
                  </Badge>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                className="flex-1"
                onClick={onRestore}
                isLoading={isRestoring}
              >
                {t('projectAdvanced.restoreProject')}
              </Button>
              <Button 
                variant="danger" 
                className="flex-1 flex items-center justify-center gap-2" 
                onClick={onDelete}
                title={secretCount > 0 ? t('projectAdvanced.secretCountWarning', { count: secretCount, plural: secretCount !== 1 ? 's' : '' }) : undefined}
              >
                <span>{t('projectAdvanced.deletePermanently')}</span>
                {secretCount > 0 && (
                  <Badge 
                    variant="warning" 
                    className="flex items-center gap-1"
                    title={t('projectAdvanced.secretsWillBeDeleted', { count: secretCount, plural: secretCount !== 1 ? 's' : '' })}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {secretCount}
                  </Badge>
                )}
              </Button>
            </>
          )}
        </div>
      </FormSection>
    );
  }

  return (
    <FormSection
      variant="default"
      title={t('projectAdvanced.leaveProject')}
      description={t('projectAdvanced.leaveProjectDescription')}
    >
      {isSoleOwner && (
        <p className="text-caption mb-4 text-status-danger">
          {t('projectAdvanced.soleOwnerWarning')}
        </p>
      )}
      {canLeaveProject && (
        <Button
          variant="secondary"
          onClick={onLeave}
          isLoading={isLeaving}
        >
          {t('projectAdvanced.leaveProject')}
        </Button>
      )}
    </FormSection>
  );
};

