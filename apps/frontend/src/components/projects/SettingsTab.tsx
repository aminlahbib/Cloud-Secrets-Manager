import React, { useCallback } from 'react';
import { LayoutGrid, Building2, Users, Crown, Shield, Mail, Clock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormSection } from '../ui/FormSection';
import { Badge } from '../ui/Badge';
import { ProjectSourceIndicator } from './ProjectSourceIndicator';
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
}) => {
  const handleWorkflowSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWorkflowId = e.target.value || null;
    onWorkflowChange(newWorkflowId);
  }, [onWorkflowChange]);

  return (
    <div className="tab-content-container space-y-6">
      {/* Project Overview */}
      <FormSection
        variant="card"
        title="Project Overview"
        className="rounded-3xl"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metaPairs.map((item) => (
            <div key={item.label} className="rounded-2xl border border-theme-subtle p-4 bg-elevation-1">
              <p className="text-xs uppercase tracking-[0.2em] text-theme-tertiary">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-theme-primary">{item.value}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-theme-subtle p-4 bg-elevation-1">
            <p className="text-xs uppercase tracking-[0.2em] text-theme-tertiary">Status</p>
            <p className="mt-2 text-lg font-semibold text-theme-primary">
              {isArchived ? 'Archived' : 'Active'}
            </p>
          </div>
        </div>
      </FormSection>

      {/* General Settings */}
      <FormSection
        variant="card"
        title="General Settings"
        actions={
          canManageProject ? (
            <Button
              onClick={onSave}
              disabled={!hasFormChanges || isSaving}
              isLoading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : undefined
        }
        className="rounded-3xl"
      >
        <div className="max-w-2xl">
          <div>
            <label className="block text-body-sm font-medium mb-2 text-theme-secondary">Project Name</label>
            <Input
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              disabled={!canManageProject}
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium mb-2 text-theme-secondary">Description</label>
            <textarea
              className="input-theme w-full px-4 py-3 rounded-xl focus:ring-2"
              rows={4}
              value={projectDescription}
              onChange={(e) => onProjectDescriptionChange(e.target.value)}
              placeholder="Describe the scope, environments, or use cases for this project."
              disabled={!canManageProject}
            />
          </div>

          {/* Workflow Selection */}
          <div>
            <label className="block text-body-sm font-medium mb-2 text-theme-secondary">
              Workflow
              <span className="font-normal ml-1 text-theme-tertiary">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none">
                <LayoutGrid className="h-4 w-4 text-theme-tertiary" />
              </div>
              <select
                value={selectedWorkflowId}
                onChange={handleWorkflowSelectChange}
                disabled={!canManageProject || isMovingWorkflow}
                className="input-theme w-full pl-10 pr-4 py-2 rounded-xl appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">No Workflow (Unassigned)</option>
                {workflows?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.isDefault && '(Default)'}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-theme-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-caption text-theme-tertiary">
              Organize this project by assigning it to a workflow. Projects can be moved between workflows at any time.
            </p>
            {isMovingWorkflow && (
              <p className="mt-1 text-caption text-status-info">Moving project...</p>
            )}
          </div>

          {/* Team Information */}
          {(project.teams && project.teams.length > 0) || project.accessSource ? (
            <div>
              <label className="block text-body-sm font-medium mb-2 text-theme-secondary">
                Team Access
              </label>
              <div className="rounded-xl border border-theme-subtle p-4 bg-elevation-1">
                {project.teams && project.teams.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
                      <span className="text-body-sm font-medium text-theme-primary">
                        This project is in {project.teams.length} team{project.teams.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.teams.map((team) => (
                        <Link
                          key={team.teamId}
                          to="/teams"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-150 text-body-sm"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--accent-primary)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-accent)';
                            e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                          }}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          {team.teamName}
                        </Link>
                      ))}
                    </div>
                    <ProjectSourceIndicator project={project} showDetailed={true} />
                    <p className="text-caption text-theme-tertiary mt-2">
                      Team members automatically get VIEWER access to this project. Manage teams from the{' '}
                      <Link to="/teams" className="underline hover:no-underline" style={{ color: 'var(--accent-primary)' }}>
                        Teams page
                      </Link>.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-theme-tertiary" />
                    <p className="text-body-sm text-theme-secondary mb-2">Not in any teams</p>
                    <p className="text-caption text-theme-tertiary">
                      Add this project to a team from the{' '}
                      <Link to="/teams" className="underline hover:no-underline" style={{ color: 'var(--accent-primary)' }}>
                        Teams page
                      </Link>{' '}
                      to grant bulk access.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </FormSection>

      {/* Members Management */}
      {canManageMembers && (
        <FormSection
          variant="card"
          title="Members & Invitations"
          description="Manage project members, their roles, and pending invitations. Role changes must respect the authorization hierarchy."
          className="rounded-3xl"
        >
          <div className="space-y-6">
            {/* Pending Invitations */}
            {pendingInvitations && pendingInvitations.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-theme-tertiary" />
                    <h3 className="text-sm font-medium text-theme-primary">
                      Pending Invitations ({pendingInvitations.length})
                    </h3>
                  </div>
                </div>
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-elevation-1 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Mail className="h-4 w-4 text-theme-tertiary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-theme-primary truncate">
                            {invitation.email}
                          </p>
                          <p className="text-xs text-theme-tertiary">
                            Invited as {invitation.role} • {new Date(invitation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {onCancelInvitation && (
                        <button
                          onClick={() => onCancelInvitation(invitation.id)}
                          className="p-1.5 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                          title="Cancel invitation"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members List */}
            {members && members.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-theme-tertiary" />
                    <h3 className="text-sm font-medium text-theme-primary">
                      Members ({members.length})
                    </h3>
                  </div>
                  {onInviteMember && (
                    <Button size="sm" onClick={onInviteMember}>
                      Invite Member
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {members.map((member) => {
                    const canEdit = canManageMembers && 
                      member.userId !== project.createdBy && 
                      (currentUserRole === 'OWNER' || (currentUserRole === 'ADMIN' && member.role !== 'OWNER'));
                    const canRemove = canManageMembers && 
                      member.userId !== project.createdBy &&
                      (currentUserRole === 'OWNER' || (currentUserRole === 'ADMIN' && member.role !== 'OWNER'));

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-elevation-1 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-elevation-2 text-theme-primary font-medium flex-shrink-0">
                            <span>
                              {(member.user?.displayName || member.user?.email || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-theme-primary truncate">
                              {member.user?.displayName || member.user?.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-theme-tertiary flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />
                              {member.user?.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {canEdit && onRoleChange && availableRoles ? (
                            <select
                              value={member.role}
                              onChange={(e) => onRoleChange(member.userId, e.target.value as ProjectRole)}
                              className="input-theme px-3 py-1.5 rounded-lg text-body-sm focus:outline-none focus:ring-2"
                              disabled={isUpdatingRole && roleChangeTarget === member.userId}
                            >
                              {availableRoles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Badge variant={member.role === 'OWNER' || member.role === 'ADMIN' ? 'owner-admin' : 'default'}>
                              {member.role === 'OWNER' && <Crown className="h-3 w-3 mr-1" />}
                              {member.role === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                              {member.role}
                            </Badge>
                          )}
                          {canRemove && onRemoveMember && (
                            <button
                              onClick={() => onRemoveMember(member.userId)}
                              className="p-1.5 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                              title="Remove member"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(!members || members.length === 0) && (!pendingInvitations || pendingInvitations.length === 0) && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-theme-tertiary" />
                <p className="text-sm text-theme-secondary mb-2">No members or invitations</p>
                {onInviteMember && (
                  <Button size="sm" onClick={onInviteMember}>
                    Invite First Member
                  </Button>
                )}
              </div>
            )}
          </div>
        </FormSection>
      )}

      {/* Project Lifecycle / Leave Project */}
      {canManageProject ? (
        <FormSection
          variant="card"
          title="Project Lifecycle"
          description="Archive projects you no longer need but may want to restore later. Permanently deleting removes all secrets and activity forever."
          className="rounded-3xl"
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
      ) : (
        <FormSection
          variant="card"
          title="Leave Project"
          description="Remove your access to this project. You will need to be re-invited to regain access."
          className="rounded-3xl"
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
      )}
    </div>
  );
});

SettingsTab.displayName = 'SettingsTab';

