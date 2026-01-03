import React from 'react';
import { Users, Clock, Mail, Crown, Shield, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { FormSection } from '../../ui/FormSection';
import { useI18n } from '../../../contexts/I18nContext';
import type { ProjectMember, ProjectRole, ProjectInvitation, Project } from '../../../types';

interface ProjectMembersSectionProps {
  project: Project;
  canManageMembers: boolean;
  members?: ProjectMember[];
  currentUserRole?: ProjectRole;
  pendingInvitations?: ProjectInvitation[];
  onInviteMember?: () => void;
  onCancelInvitation?: (invitationId: string) => void;
  onRoleChange?: (memberId: string, newRole: ProjectRole) => void;
  onRemoveMember?: (memberId: string) => void;
  availableRoles?: ProjectRole[];
  roleChangeTarget?: string | null;
  isUpdatingRole?: boolean;
}

export const ProjectMembersSection: React.FC<ProjectMembersSectionProps> = ({
  project,
  canManageMembers,
  members,
  currentUserRole,
  pendingInvitations,
  onInviteMember,
  onCancelInvitation,
  onRoleChange,
  onRemoveMember,
  availableRoles,
  roleChangeTarget,
  isUpdatingRole,
}) => {
  const { t } = useI18n();
  
  if (!canManageMembers) {
    return null;
  }

  return (
    <FormSection
      variant="default"
      title={t('projectDetail.settings.members')}
      description={t('projectDetail.settings.membersDescription')}
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
                        {t('projectDetail.settings.invitedAs')
                          .replace('{{role}}', invitation.role)
                          .replace('{{date}}', new Date(invitation.createdAt).toLocaleDateString())}
                      </p>
                    </div>
                  </div>
                  {onCancelInvitation && (
                    <button
                      onClick={() => onCancelInvitation(invitation.id)}
                      className="p-1.5 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                      title={t('projectDetail.settings.cancelInvitation')}
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
                  {t('projectDetail.settings.membersCount').replace('{{count}}', String(members.length))}
                </h3>
              </div>
              {onInviteMember && (
                <Button size="sm" onClick={onInviteMember}>
                  {t('projectDetail.settings.inviteMember')}
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
                          {member.user?.displayName || member.user?.email || t('projectDetail.settings.unknown')}
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
                          title={t('projectDetail.settings.removeMember')}
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
            <p className="text-sm text-theme-secondary mb-2">{t('projectDetail.settings.noMembersOrInvitations')}</p>
            {onInviteMember && (
              <Button size="sm" onClick={onInviteMember}>
                {t('projectDetail.settings.inviteFirstMember')}
              </Button>
            )}
          </div>
        )}
      </div>
    </FormSection>
  );
};

