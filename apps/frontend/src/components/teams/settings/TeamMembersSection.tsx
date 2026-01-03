import React from 'react';
import { Users, Mail, Crown, Shield, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { FormSection } from '../../ui/FormSection';
import { useI18n } from '../../../contexts/I18nContext';
import type { Team, TeamMember, TeamRole } from '../../../types';

interface TeamMembersSectionProps {
  team: Team;
  members?: TeamMember[];
  canManageTeam: boolean;
  onAddMember?: () => void;
  onRoleChange?: (memberId: string, newRole: TeamRole) => void;
  onRemoveMember?: (memberId: string) => void;
  roleChangeTarget?: string | null;
  isUpdatingRole?: boolean;
}

export const TeamMembersSection: React.FC<TeamMembersSectionProps> = ({
  team,
  members,
  canManageTeam,
  onAddMember,
  onRoleChange,
  onRemoveMember,
  roleChangeTarget,
  isUpdatingRole,
}) => {
  const { t } = useI18n();
  return (
    <FormSection
      variant="card"
      title={t('teamDetail.settings.members')}
      description={t('teamDetail.settings.membersDescription')}
      className="rounded-3xl"
    >
      <div className="space-y-6">
        {members && members.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-theme-tertiary" />
                <h3 className="text-sm font-medium text-theme-primary">
                  Members ({members.length})
                </h3>
              </div>
              {onAddMember && (
                <Button size="sm" onClick={onAddMember}>
                  Add Member
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {members.map((member) => {
                const canEdit = canManageTeam && 
                  member.userId !== team.createdBy && 
                  (team.currentUserRole === 'TEAM_OWNER' || (team.currentUserRole === 'TEAM_ADMIN' && member.role !== 'TEAM_OWNER'));
                const canRemove = canManageTeam && 
                  member.userId !== team.createdBy &&
                  (team.currentUserRole === 'TEAM_OWNER' || (team.currentUserRole === 'TEAM_ADMIN' && member.role !== 'TEAM_OWNER'));

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-elevation-1 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-elevation-2 text-theme-primary font-medium flex-shrink-0">
                        <span>
                          {(member.displayName || member.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-theme-primary truncate">
                          {member.displayName || member.email || 'Unknown'}
                        </p>
                        <p className="text-xs text-theme-tertiary flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canEdit && onRoleChange ? (
                        <select
                          value={member.role}
                          onChange={(e) => onRoleChange(member.userId, e.target.value as TeamRole)}
                          className="input-theme px-3 py-1.5 rounded-lg text-body-sm focus:outline-none focus:ring-2"
                          disabled={isUpdatingRole && roleChangeTarget === member.userId}
                        >
                          <option value="TEAM_MEMBER">Member</option>
                          {team.currentUserRole === 'TEAM_OWNER' && (
                            <>
                              <option value="TEAM_ADMIN">Admin</option>
                              <option value="TEAM_OWNER">Owner</option>
                            </>
                          )}
                        </select>
                      ) : (
                        <Badge variant={member.role === 'TEAM_OWNER' || member.role === 'TEAM_ADMIN' ? 'owner-admin' : 'default'}>
                          {member.role === 'TEAM_OWNER' && <Crown className="h-3 w-3 mr-1" />}
                          {member.role === 'TEAM_ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                          {member.role.replace('TEAM_', '')}
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
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-theme-tertiary" />
            <p className="text-sm text-theme-secondary mb-2">No members in this team</p>
            {onAddMember && (
              <Button size="sm" onClick={onAddMember}>
                Add First Member
              </Button>
            )}
          </div>
        )}
      </div>
    </FormSection>
  );
};

