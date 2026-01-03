import React, { useState, useMemo, useCallback } from 'react';
import { Mail, Users, Trash2, Crown, Shield, Search, Plus, Filter, Clock, X } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useI18n } from '../../contexts/I18nContext';
import { useDebounce } from '../../utils/debounce';
import type { ProjectMember, TeamMember, ProjectRole, TeamRole, ProjectInvitation } from '../../types';

type UnifiedMember = ProjectMember | TeamMember;

const PROJECT_ROLE_ICONS: Record<ProjectRole, React.ReactNode> = {
  OWNER: <Crown className="h-3 w-3" />,
  ADMIN: <Shield className="h-3 w-3" />,
  MEMBER: null,
  VIEWER: null,
};

const TEAM_ROLE_ICONS: Record<TeamRole, React.ReactNode> = {
  TEAM_OWNER: <Crown className="h-3 w-3" />,
  TEAM_ADMIN: <Shield className="h-3 w-3" />,
  TEAM_MEMBER: null,
};

interface MembersTabProps {
  members: UnifiedMember[] | undefined;
  type: 'project' | 'team';
  isLoading: boolean;
  currentUserId?: string;
  currentUserRole: ProjectRole | TeamRole;
  canManageMembers: boolean;
  availableRoles: (ProjectRole | TeamRole)[];
  roleChangeTarget?: string | null;
  isUpdatingRole?: boolean;
  pendingInvitations?: ProjectInvitation[];
  onRoleChange: (memberId: string, newRole: ProjectRole | TeamRole) => void;
  onRemoveMember: (memberId: string) => void;
  onInviteMember: () => void;
  onCancelInvitation?: (invitationId: string) => void;
}

export const MembersTab: React.FC<MembersTabProps> = React.memo(({
  members,
  type,
  isLoading,
  currentUserId,
  currentUserRole,
  canManageMembers,
  availableRoles,
  roleChangeTarget,
  isUpdatingRole = false,
  pendingInvitations,
  onRoleChange,
  onRemoveMember,
  onInviteMember,
  onCancelInvitation,
}) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get member display info
  const getMemberInfo = useCallback((member: UnifiedMember) => {
    if (type === 'project') {
      const pm = member as ProjectMember;
      return {
        id: pm.id,
        userId: pm.userId,
        displayName: pm.user?.displayName || pm.user?.email || 'Unknown',
        email: pm.user?.email || '',
        role: pm.role as ProjectRole,
        joinedAt: pm.joinedAt,
      };
    } else {
      const tm = member as TeamMember;
      return {
        id: tm.id,
        userId: tm.userId,
        displayName: tm.displayName || tm.email || 'Unknown',
        email: tm.email,
        role: tm.role as TeamRole,
        joinedAt: undefined,
      };
    }
  }, [type]);

  // Get role icon
  const getRoleIcon = useCallback((role: ProjectRole | TeamRole) => {
    if (type === 'project') {
      return PROJECT_ROLE_ICONS[role as ProjectRole];
    } else {
      return TEAM_ROLE_ICONS[role as TeamRole];
    }
  }, [type]);

  // Get role display name
  const getRoleDisplayName = useCallback((role: ProjectRole | TeamRole) => {
    if (type === 'team') {
      return (role as TeamRole).replace('TEAM_', '');
    }
    return role as string;
  }, [type]);

  // Role priority for sorting
  const getRolePriority = useCallback((role: ProjectRole | TeamRole) => {
    if (type === 'project') {
      const r = role as ProjectRole;
      if (r === 'OWNER') return 0;
      if (r === 'ADMIN') return 1;
      if (r === 'MEMBER') return 2;
      return 3; // VIEWER
    } else {
      const r = role as TeamRole;
      if (r === 'TEAM_OWNER') return 0;
      if (r === 'TEAM_ADMIN') return 1;
      return 2; // TEAM_MEMBER
    }
  }, [type]);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    if (!members) return [];

    const filtered = members.filter((member) => {
      const info = getMemberInfo(member);
      
      // Search filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch = 
          info.displayName.toLowerCase().includes(searchLower) ||
          info.email.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Role filter
      if (roleFilter !== 'all') {
        if (type === 'team') {
          const roleWithoutPrefix = (info.role as TeamRole).replace('TEAM_', '');
          if (roleWithoutPrefix !== roleFilter) return false;
        } else {
          if (info.role !== roleFilter) return false;
        }
      }

      return true;
    });

    // Sort by role priority, then by name
    return filtered.sort((a, b) => {
      const infoA = getMemberInfo(a);
      const infoB = getMemberInfo(b);
      const priorityDiff = getRolePriority(infoA.role) - getRolePriority(infoB.role);
      if (priorityDiff !== 0) return priorityDiff;
      return infoA.displayName.localeCompare(infoB.displayName);
    });
  }, [members, debouncedSearchTerm, roleFilter, type, getMemberInfo, getRolePriority]);

  // Group members by role
  const membersByRole = useMemo(() => {
    const grouped: Record<string, typeof filteredMembers> = {};
    filteredMembers.forEach((member) => {
      const info = getMemberInfo(member);
      const roleKey = type === 'team' 
        ? (info.role as TeamRole).replace('TEAM_', '')
        : info.role;
      if (!grouped[roleKey]) {
        grouped[roleKey] = [];
      }
      grouped[roleKey].push(member);
    });
    return grouped;
  }, [filteredMembers, type, getMemberInfo]);

  // Get available role options for filter
  const roleFilterOptions = useMemo(() => {
    if (type === 'project') {
      return [
        { value: 'all', label: t('members.filterAllRoles') },
        { value: 'OWNER', label: 'Owner' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'MEMBER', label: 'Member' },
        { value: 'VIEWER', label: 'Viewer' },
      ];
    } else {
      return [
        { value: 'all', label: t('members.filterAllRoles') },
        { value: 'OWNER', label: 'Owner' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'MEMBER', label: 'Member' },
      ];
    }
  }, [type, t]);

  // Check if user can edit member role
  const canEditMemberRole = useCallback((member: UnifiedMember) => {
    if (!canManageMembers) return false;
    
    const info = getMemberInfo(member);
    
    // Cannot edit your own role
    if (info.userId === currentUserId) return false;

    // For projects
    if (type === 'project') {
      const memberRole = info.role as ProjectRole;
      const userRole = currentUserRole as ProjectRole;
      
      // Only OWNER can edit OWNER roles
      if (memberRole === 'OWNER' && userRole !== 'OWNER') return false;
      
      // Cannot edit if you're not OWNER or ADMIN
      if (userRole !== 'OWNER' && userRole !== 'ADMIN') return false;
    } else {
      // For teams
      const memberRole = info.role as TeamRole;
      const userRole = currentUserRole as TeamRole;
      
      // Only TEAM_OWNER can edit TEAM_OWNER roles
      if (memberRole === 'TEAM_OWNER' && userRole !== 'TEAM_OWNER') return false;
      
      // Cannot edit if you're not TEAM_OWNER or TEAM_ADMIN
      if (userRole !== 'TEAM_OWNER' && userRole !== 'TEAM_ADMIN') return false;
    }

    return true;
  }, [canManageMembers, currentUserId, currentUserRole, type, getMemberInfo]);

  // Check if user can remove member
  const canRemoveMember = useCallback((member: UnifiedMember) => {
    if (!canManageMembers) return false;
    
    const info = getMemberInfo(member);
    
    // Cannot remove yourself
    if (info.userId === currentUserId) return false;

    // For projects
    if (type === 'project') {
      const memberRole = info.role as ProjectRole;
      const userRole = currentUserRole as ProjectRole;
      
      // Only OWNER can remove OWNER
      if (memberRole === 'OWNER' && userRole !== 'OWNER') return false;
    } else {
      // For teams
      const memberRole = info.role as TeamRole;
      const userRole = currentUserRole as TeamRole;
      
      // Only TEAM_OWNER can remove TEAM_OWNER
      if (memberRole === 'TEAM_OWNER' && userRole !== 'TEAM_OWNER') return false;
    }

    return true;
  }, [canManageMembers, currentUserId, currentUserRole, type, getMemberInfo]);

  // Get badge variant
  const getBadgeVariant = useCallback((role: ProjectRole | TeamRole) => {
    if (type === 'project') {
      const r = role as ProjectRole;
      if (r === 'OWNER' || r === 'ADMIN') return 'owner-admin';
      if (r === 'MEMBER') return 'info';
      return 'default';
    } else {
      const r = role as TeamRole;
      if (r === 'TEAM_OWNER' || r === 'TEAM_ADMIN') return 'owner-admin';
      return 'default';
    }
  }, [type]);

  const handleRoleChange = useCallback((member: UnifiedMember, e: React.ChangeEvent<HTMLSelectElement>) => {
    const info = getMemberInfo(member);
    onRoleChange(info.userId, e.target.value as ProjectRole | TeamRole);
  }, [onRoleChange, getMemberInfo]);

  const handleRemoveMember = useCallback((member: UnifiedMember) => {
    const info = getMemberInfo(member);
    onRemoveMember(info.userId);
  }, [onRemoveMember, getMemberInfo]);

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
        title={t('members.noMembers')}
        description={t('members.inviteDescription')}
        action={
          canManageMembers
            ? {
                label: t('members.inviteMember'),
                onClick: onInviteMember,
              }
            : undefined
        }
      />
    );
  }

  const pendingCount = pendingInvitations?.length || 0;

  return (
    <div className="tab-content-container space-y-4">
      {/* Pending Invitations Section */}
      {pendingCount > 0 && type === 'project' && (
        <div className="rounded-lg border border-theme-subtle bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-theme-tertiary" />
              <span className="text-sm font-medium text-theme-primary">
                Pending Invitations ({pendingCount})
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {pendingInvitations!.map((invitation) => (
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
                {canManageMembers && onCancelInvitation && (
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

      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-theme-tertiary pointer-events-none z-10" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('members.searchPlaceholder')}
              className="input-theme pl-10 pr-4 py-2.5 w-full text-body-sm rounded-xl border border-theme-subtle focus:border-accent-primary focus:ring-2 focus:ring-accent-primary-glow transition-all"
              style={{
                backgroundColor: 'var(--elevation-1)',
              }}
            />
          </div>

          {/* Role Filter */}
          <div className="relative flex-1 sm:flex-initial sm:w-40">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-theme-tertiary pointer-events-none z-10" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-theme pl-10 pr-8 py-2.5 w-full text-body-sm rounded-xl border border-theme-subtle focus:border-accent-primary focus:ring-2 focus:ring-accent-primary-glow transition-all appearance-none cursor-pointer"
              style={{
                backgroundColor: 'var(--elevation-1)',
              }}
            >
              {roleFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-theme-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Add Member Button */}
        {canManageMembers && (
          <Button size="sm" onClick={onInviteMember}>
            <Plus className="h-4 w-4 mr-1" />
            {t('members.inviteMember')}
          </Button>
        )}
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-theme-secondary">
            {debouncedSearchTerm || roleFilter !== 'all'
              ? t('members.noMembersMatch')
              : t('members.noMembers')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(membersByRole)
            .sort(([roleA], [roleB]) => {
              const priorityA = getRolePriority((type === 'team' ? `TEAM_${roleA}` : roleA) as ProjectRole | TeamRole);
              const priorityB = getRolePriority((type === 'team' ? `TEAM_${roleB}` : roleB) as ProjectRole | TeamRole);
              return priorityA - priorityB;
            })
            .map(([role, roleMembers]) => {
              const roleKey = type === 'team' ? `TEAM_${role}` : role;
              const roleIcon = getRoleIcon(roleKey as ProjectRole | TeamRole);
              const badgeVariant = getBadgeVariant(roleKey as ProjectRole | TeamRole);
              
              return (
                <div key={role} className="space-y-2">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Badge variant={badgeVariant} className="text-xs">
                      {roleIcon && <span className="mr-1">{roleIcon}</span>}
                      {getRoleDisplayName(roleKey as ProjectRole | TeamRole)}
                    </Badge>
                    <span className="text-xs text-theme-tertiary">
                      ({roleMembers.length})
                    </span>
                  </div>
                  <div className="rounded-lg border border-theme-subtle divide-y divide-theme-subtle bg-card">
                    {roleMembers.map((member) => {
                      const info = getMemberInfo(member);
                      const canEdit = canEditMemberRole(member);
                      const canRemove = canRemoveMember(member);
                      const isUpdating = roleChangeTarget === info.userId && isUpdatingRole;
                      const memberRoleIcon = getRoleIcon(info.role);
                      const memberBadgeVariant = getBadgeVariant(info.role);

                      return (
                        <div
                          key={member.id}
                          className="p-4 flex items-center justify-between transition-colors hover:bg-elevation-1"
                        >
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-elevation-1 text-theme-primary font-medium flex-shrink-0">
                              <span>
                                {info.displayName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            </div>

                            {/* Member Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-theme-primary truncate">
                                {info.displayName}
                                {info.userId === currentUserId && (
                                  <span className="ml-2 text-xs text-theme-tertiary">{t('members.you')}</span>
                                )}
                              </p>
                              <p className="text-sm flex items-center text-theme-tertiary truncate">
                                <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{info.email}</span>
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            {/* Role Selector/Badge */}
                            {canEdit ? (
                              <select
                                value={info.role}
                                onChange={(e) => handleRoleChange(member, e)}
                                className="input-theme px-3 py-1.5 rounded-lg text-body-sm focus:outline-none focus:ring-2"
                                disabled={isUpdating}
                              >
                                {availableRoles.map((r) => (
                                  <option key={r} value={r}>
                                    {getRoleDisplayName(r)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Badge variant={memberBadgeVariant}>
                                {memberRoleIcon && <span className="mr-1">{memberRoleIcon}</span>}
                                {getRoleDisplayName(info.role)}
                              </Badge>
                            )}

                            {/* Remove Button */}
                            {canRemove && (
                              <button
                                onClick={() => handleRemoveMember(member)}
                                className="p-2 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                                title={t('members.removeMember')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
});

MembersTab.displayName = 'MembersTab';

