import React, { useCallback } from 'react';
import { Mail, Users, Trash2 } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';
import type { ProjectMember, ProjectRole } from '../../types';

interface MembersTabProps {
  members: ProjectMember[] | undefined;
  isLoading: boolean;
  currentUserId?: string;
  canManageMembers: boolean;
  canEditMemberRole: (member: ProjectMember) => boolean;
  availableRoleOptions: ProjectRole[];
  roleChangeTarget: string | null;
  isUpdatingRole: boolean;
  onRoleChange: (member: ProjectMember, newRole: ProjectRole) => void;
  onRemoveMember: (userId: string) => void;
  onInviteMember: () => void;
}

export const MembersTab: React.FC<MembersTabProps> = React.memo(({
  members,
  isLoading,
  currentUserId,
  canManageMembers,
  canEditMemberRole,
  availableRoleOptions,
  roleChangeTarget,
  isUpdatingRole,
  onRoleChange,
  onRemoveMember,
  onInviteMember,
}) => {
  const handleRoleChange = useCallback((member: ProjectMember, e: React.ChangeEvent<HTMLSelectElement>) => {
    onRoleChange(member, e.target.value as ProjectRole);
  }, [onRoleChange]);

  const handleRemoveMember = useCallback((userId: string) => {
    onRemoveMember(userId);
  }, [onRemoveMember]);
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-16 w-16 text-theme-tertiary" />}
        title="No members"
        description="Invite team members to collaborate on this project"
        action={
          canManageMembers
            ? {
                label: 'Invite Member',
                onClick: onInviteMember,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="tab-content-container space-y-4">
      <div className="rounded-lg border border-theme-subtle divide-y divide-theme-subtle bg-card">
        {members.map((member) => (
          <div
            key={member.id}
            className="p-4 flex items-center justify-between transition-colors hover:bg-elevation-1"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-elevation-1 text-theme-tertiary">
                <span className="font-medium">
                  {(member.user?.displayName || member.user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-theme-primary">
                  {member.user?.displayName || member.user?.email}
                  {member.userId === currentUserId && (
                    <span className="ml-2 text-xs text-theme-tertiary">(You)</span>
                  )}
                </p>
                <p className="text-sm flex items-center text-theme-tertiary">
                  <Mail className="h-3 w-3 mr-1" />
                  {member.user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {canEditMemberRole(member) ? (
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member, e)}
                  className="input-theme px-3 py-1.5 rounded-lg text-body-sm focus:outline-none focus:ring-2"
                  disabled={roleChangeTarget === member.userId && isUpdatingRole}
                >
                  {availableRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0) + role.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge variant={member.role === 'OWNER' || member.role === 'ADMIN' ? 'owner-admin' : member.role === 'MEMBER' ? 'info' : 'default'}>
                  {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                </Badge>
              )}
              {canManageMembers && member.userId !== currentUserId && (
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  className="p-2 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

MembersTab.displayName = 'MembersTab';

