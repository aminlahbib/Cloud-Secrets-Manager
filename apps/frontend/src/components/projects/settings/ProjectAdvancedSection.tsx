import React from 'react';
import { Button } from '../../ui/Button';
import { FormSection } from '../../ui/FormSection';
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
}) => {
  if (canManageProject) {
    return (
      <FormSection
        variant="default"
        title="Project Lifecycle"
        description="Archive projects you no longer need but may want to restore later. Permanently deleting removes all secrets and activity forever."
      >
        {transferableMembers.length > 0 && (
          <div className="flex flex-col gap-3 md:flex-row">
            <Button variant="secondary" className="flex-1" onClick={onTransferOwnership}>
              Transfer Ownership
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
                Archive Project
              </Button>
              <Button variant="danger" className="flex-1" onClick={onDelete}>
                Delete Project
              </Button>
            </>
          ) : (
            <>
              <Button
                className="flex-1"
                onClick={onRestore}
                isLoading={isRestoring}
              >
                Restore Project
              </Button>
              <Button variant="danger" className="flex-1" onClick={onDelete}>
                Delete Permanently
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
      title="Leave Project"
      description="Remove your access to this project. You will need to be re-invited to regain access."
    >
      {isSoleOwner && (
        <p className="text-caption mb-4 text-status-danger">
          Promote another member to Owner before leaving. Projects require at least one active owner.
        </p>
      )}
      {canLeaveProject && (
        <Button
          variant="secondary"
          onClick={onLeave}
          isLoading={isLeaving}
        >
          Leave Project
        </Button>
      )}
    </FormSection>
  );
};

