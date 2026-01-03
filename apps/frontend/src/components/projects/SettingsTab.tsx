import React, { useState } from 'react';
import { FileText, Settings, Users, AlertTriangle } from 'lucide-react';
import { SettingsLayout, type SettingsSection } from '../shared/SettingsLayout';
import { useI18n } from '../../contexts/I18nContext';
import { ProjectOverviewSection } from './settings/ProjectOverviewSection';
import { ProjectGeneralSettingsSection } from './settings/ProjectGeneralSettingsSection';
import { ProjectMembersSection } from './settings/ProjectMembersSection';
import { ProjectAdvancedSection } from './settings/ProjectAdvancedSection';
import type { Workflow, ProjectMember, Project, ProjectRole, ProjectInvitation } from '../../types';

interface SettingsTabProps {
  project: Project;
  metaPairs: Array<{ label: string; value: string | number }>;
  isArchived: boolean;
  canManageProject: boolean;
  canLeaveProject: boolean;
  isSoleOwner: boolean;
  // Form state
  projectName: string;
  projectDescription: string;
  onProjectNameChange: (name: string) => void;
  onProjectDescriptionChange: (description: string) => void;
  hasFormChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  // Workflow
  workflows: Workflow[] | undefined;
  selectedWorkflowId: string;
  onWorkflowChange: (workflowId: string | null) => void;
  isMovingWorkflow: boolean;
  // Lifecycle actions
  transferableMembers: ProjectMember[];
  onTransferOwnership: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onLeave: () => void;
  isArchiving: boolean;
  isRestoring: boolean;
  isLeaving: boolean;
  // Members management
  members?: ProjectMember[];
  currentUserRole?: ProjectRole;
  canManageMembers?: boolean;
  pendingInvitations?: ProjectInvitation[];
  onInviteMember?: () => void;
  onCancelInvitation?: (invitationId: string) => void;
  onRoleChange?: (memberId: string, newRole: ProjectRole) => void;
  onRemoveMember?: (memberId: string) => void;
  availableRoles?: ProjectRole[];
  roleChangeTarget?: string | null;
  isUpdatingRole?: boolean;
  secretCount?: number;
}

export const SettingsTab: React.FC<SettingsTabProps> = React.memo(({
  project,
  metaPairs,
  isArchived,
  canManageProject,
  canLeaveProject,
  isSoleOwner,
  projectName,
  projectDescription,
  onProjectNameChange,
  onProjectDescriptionChange,
  hasFormChanges,
  isSaving,
  onSave,
  workflows,
  selectedWorkflowId,
  onWorkflowChange,
  isMovingWorkflow,
  transferableMembers,
  onTransferOwnership,
  onArchive,
  onRestore,
  onDelete,
  onLeave,
  isArchiving,
  isRestoring,
  isLeaving,
  members,
  currentUserRole,
  canManageMembers,
  pendingInvitations,
  onInviteMember,
  onCancelInvitation,
  onRoleChange,
  onRemoveMember,
  availableRoles,
  roleChangeTarget,
  isUpdatingRole,
  secretCount,
}) => {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections: SettingsSection[] = [
    {
      id: 'overview',
      title: t('projectDetail.settings.overview'),
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'general',
      title: t('projectDetail.settings.general'),
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: 'members',
      title: t('projectDetail.settings.members'),
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'advanced',
      title: t('projectDetail.settings.advanced'),
      icon: <AlertTriangle className="h-4 w-4" />,
    },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <ProjectOverviewSection
            metaPairs={metaPairs}
            isArchived={isArchived}
          />
        );
      case 'general':
        return (
          <ProjectGeneralSettingsSection
            project={project}
            canManageProject={canManageProject}
            projectName={projectName}
            projectDescription={projectDescription}
            onProjectNameChange={onProjectNameChange}
            onProjectDescriptionChange={onProjectDescriptionChange}
            hasFormChanges={hasFormChanges}
            isSaving={isSaving}
            onSave={onSave}
            workflows={workflows}
            selectedWorkflowId={selectedWorkflowId}
            onWorkflowChange={onWorkflowChange}
            isMovingWorkflow={isMovingWorkflow}
          />
        );
      case 'members':
        return (
          <ProjectMembersSection
            project={project}
            canManageMembers={canManageMembers ?? false}
            members={members}
            currentUserRole={currentUserRole}
            pendingInvitations={pendingInvitations}
            onInviteMember={onInviteMember}
            onCancelInvitation={onCancelInvitation}
            onRoleChange={onRoleChange}
            onRemoveMember={onRemoveMember}
            availableRoles={availableRoles}
            roleChangeTarget={roleChangeTarget}
            isUpdatingRole={isUpdatingRole}
          />
        );
      case 'advanced':
        return (
          <ProjectAdvancedSection
            canManageProject={canManageProject}
            canLeaveProject={canLeaveProject}
            isSoleOwner={isSoleOwner}
            transferableMembers={transferableMembers}
            onTransferOwnership={onTransferOwnership}
            onArchive={onArchive}
            onRestore={onRestore}
            onDelete={onDelete}
            onLeave={onLeave}
            isArchived={isArchived}
            isArchiving={isArchiving}
            isRestoring={isRestoring}
            isLeaving={isLeaving}
            secretCount={secretCount}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="tab-content-container">
      <SettingsLayout
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      >
        {renderSectionContent()}
      </SettingsLayout>
    </div>
  );
});

SettingsTab.displayName = 'SettingsTab';
