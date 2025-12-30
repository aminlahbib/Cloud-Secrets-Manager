import React, { useMemo, useState, useCallback } from 'react';
import { Search, Users, Mail, Crown, Shield, User, Eye, Plus, Trash2 } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useI18n } from '../../contexts/I18nContext';
import type { ProjectMember, ProjectRole, TeamMember, TeamRole } from '../../types';

// Role hierarchy for projects
const PROJECT_ROLE_ORDER: Record<ProjectRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

// Role hierarchy for teams
const TEAM_ROLE_ORDER: Record<TeamRole, number> = {
  TEAM_OWNER: 3,
  TEAM_ADMIN: 2,
  TEAM_MEMBER: 1,
};

const PROJECT_ROLE_ICONS: Record<ProjectRole, React.ReactNode> = {
  OWNER: <Crown className="h-3.5 w-3.5" />,
  ADMIN: <Shield className="h-3.5 w-3.5" />,
  MEMBER: <User className="h-3.5 w-3.5" />,
  VIEWER: <Eye className="h-3.5 w-3.5" />,
};

const TEAM_ROLE_ICONS: Record<TeamRole, React.ReactNode> = {
  TEAM_OWNER: <Crown className="h-3.5 w-3.5" />,
  TEAM_ADMIN: <Shield className="h-3.5 w-3.5" />,
  TEAM_MEMBER: <User className="h-3.5 w-3.5" />,
};

const PROJECT_ROLE_COLORS: Record<ProjectRole, 'owner-admin' | 'info' | 'default'> = {
  OWNER: 'owner-admin',
  ADMIN: 'owner-admin',
  MEMBER: 'info',
  VIEWER: 'default',
};

const TEAM_ROLE_COLORS: Record<TeamRole, 'owner-admin' | 'info' | 'default'> = {
  TEAM_OWNER: 'owner-admin',
  TEAM_ADMIN: 'owner-admin',
  TEAM_MEMBER: 'default',
};

// Unified member type
type UnifiedMember = (ProjectMember | TeamMember) & {
  displayName?: string;
  email?: string;
  avatarUrl?: string;
};

interface MembersTabProps {
  // Data
  members: UnifiedMember[] | undefined;
  isLoading: boolean;
  currentUserId?: string;
  
  // Context (project or team)
  contextType: 'project' | 'team';
  currentUserRole?: ProjectRole | TeamRole;
  
  // Permissions
  canManageMembers: boolean;
  canInviteMembers: boolean;
  
  // Role management
  availableRoles: (ProjectRole | TeamRole)[];
  onRoleChange?: (member: UnifiedMember, newRole: ProjectRole | TeamRole) => void;
  canChangeRole?: (member: UnifiedMember) => boolean;
  isUpdatingRole?: boolean;
  
  // Member management
  onRemoveMember?: (member: UnifiedMember) => void;
  onInviteMember?: () => void;
  
  // Optional: custom empty state
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export const MembersTab: React.FC<MembersTabProps> = React.memo(({
  members,
  isLoading,
  currentUserId,
  contextType,
  currentUserRole,
  canManageMembers,
  canInviteMembers,
  availableRoles,
  onRoleChange,
  canChangeRole,
  isUpdatingRole = false,
  onRemoveMember,
  onInviteMember,
  emptyStateTitle,
  emptyStateDescription,
}) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  // Filter members by search term and role
  const filteredMembers = useMemo(() => {
    if (!members) return [];

    let filtered = members;

    // Filter by search term (name or email)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((member) => {
        const name = (member.user?.displayName || member.displayName || '').toLowerCase();
        const email = (member.user?.email || member.email || '').toLowerCase();
        return name.includes(search) || email.includes(search);
      });
    }

    // Filter by role
    if (selectedRoleFilter !== 'all') {
      filtered = filtered.filter((member) => {
        const role = contextType === 'project' 
          ? (member as ProjectMember).role 
          : (member as TeamMember).role;
        return role === selectedRoleFilter;
      });
    }

    // Sort by role (highest first), then by name
    return filtered.sort((a, b) => {
      const roleA = contextType === 'project' 
        ? (a as ProjectMember).role 
        : (a as TeamMember).role;
      const roleB = contextType === 'project' 
        ? (b as ProjectMember).role 
        : (b as TeamMember).role;
      
      const orderA = contextType === 'project' 
        ? PROJECT_ROLE_ORDER[roleA as ProjectRole]
        : TEAM_ROLE_ORDER[roleA as TeamRole];
      const orderB = contextType === 'project' 
        ? PROJECT_ROLE_ORDER[roleB as ProjectRole]
        : TEAM_ROLE_ORDER[roleB as TeamRole];
      
      if (orderA !== orderB) {
        return orderB - orderA; // Higher role first
      }
      
      const nameA = (a.user?.displayName || a.displayName || a.user?.email || a.email || '').toLowerCase();
      const nameB = (b.user?.displayName || b.displayName || b.user?.email || b.email || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [members, searchTerm, selectedRoleFilter, contextType]);

  // Get role options for filter
  const roleFilterOptions = useMemo(() => {
    const roles = contextType === 'project'
      ? (['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as ProjectRole[])
      : (['TEAM_OWNER', 'TEAM_ADMIN', 'TEAM_MEMBER'] as TeamRole[]);
    
    return [
      { value: 'all', label: 'All Roles' },
      ...roles.map((role) => ({
        value: role,
        label: contextType === 'project'
          ? role.charAt(0) + role.slice(1).toLowerCase()
          : role.replace('TEAM_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      })),
    ];
  }, [contextType]);

  const handleRoleChange = useCallback((member: UnifiedMember, newRole: ProjectRole | TeamRole) => {
    if (onRoleChange) {
      onRoleChange(member, newRole);
      setEditingMemberId(null);
    }
  }, [onRoleChange]);

  const handleRemoveClick = useCallback((member: UnifiedMember) => {
    setShowRemoveConfirm(member.userId || (member as any).id);
  }, []);

  const confirmRemove = useCallback(() => {
    if (showRemoveConfirm && onRemoveMember) {
      const member = members?.find(m => (m.userId || (m as any).id) === showRemoveConfirm);
      if (member) {
        onRemoveMember(member);
      }
      setShowRemoveConfirm(null);
    }
  }, [showRemoveConfirm, onRemoveMember, members]);

  const getMemberRole = (member: UnifiedMember): ProjectRole | TeamRole => {
    return contextType === 'project'
      ? (member as ProjectMember).role
      : (member as TeamMember).role;
  };

  const getRoleIcon = (role: ProjectRole | TeamRole): React.ReactNode => {
    return contextType === 'project'
      ? PROJECT_ROLE_ICONS[role as ProjectRole]
      : TEAM_ROLE_ICONS[role as TeamRole];
  };

  const getRoleColor = (role: ProjectRole | TeamRole): 'owner-admin' | 'info' | 'default' => {
    return contextType === 'project'
      ? PROJECT_ROLE_COLORS[role as ProjectRole]
      : TEAM_ROLE_COLORS[role as TeamRole];
  };

  const formatRoleName = (role: ProjectRole | TeamRole): string => {
    if (contextType === 'project') {
      return role.charAt(0) + role.slice(1).toLowerCase();
    }
    return role.replace('TEAM_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getMemberDisplayName = (member: UnifiedMember): string => {
    return member.user?.displayName || member.displayName || member.user?.email || member.email || 'Unknown';
  };

  const getMemberEmail = (member: UnifiedMember): string => {
    return member.user?.email || member.email || '';
  };

  const getMemberAvatar = (member: UnifiedMember): string | undefined => {
    return member.user?.avatarUrl || member.avatarUrl;
  };

  const getMemberInitials = (member: UnifiedMember): string => {
    const name = getMemberDisplayName(member);
    if (name.includes('@')) {
      return name.charAt(0).toUpperCase();
    }
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isCurrentUser = (member: UnifiedMember): boolean => {
    return member.userId === currentUserId || (member as any).id === currentUserId;
  };

  const canEditThisMember = (member: UnifiedMember): boolean => {
    if (!canManageMembers) return false;
    if (isCurrentUser(member)) return false;
    if (canChangeRole) {
      return canChangeRole(member);
    }
    // Default: can edit if not owner and current user is owner/admin
    const memberRole = getMemberRole(member);
    if (contextType === 'project') {
      return memberRole !== 'OWNER' && (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN');
    } else {
      return memberRole !== 'TEAM_OWNER' && (currentUserRole === 'TEAM_OWNER' || currentUserRole === 'TEAM_ADMIN');
    }
  };

  const canRemoveThisMember = (member: UnifiedMember): boolean => {
    if (!canManageMembers) return false;
    if (isCurrentUser(member)) return false;
    const memberRole = getMemberRole(member);
    if (contextType === 'project') {
      // Can't remove if they're the last owner
      if (memberRole === 'OWNER') {
        const ownerCount = members?.filter(m => getMemberRole(m) === 'OWNER').length || 0;
        if (ownerCount <= 1) return false;
      }
      return currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
    } else {
      if (memberRole === 'TEAM_OWNER') {
        const ownerCount = members?.filter(m => getMemberRole(m) === 'TEAM_OWNER').length || 0;
        if (ownerCount <= 1) return false;
      }
      return currentUserRole === 'TEAM_OWNER' || currentUserRole === 'TEAM_ADMIN';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="tab-content-container">
        <EmptyState
          icon={<Users className="h-16 w-16 text-theme-tertiary" />}
          title={emptyStateTitle || t('members.noMembers')}
          description={emptyStateDescription || t('members.inviteDescription')}
          action={
            canInviteMembers
              ? {
                  label: t('members.inviteMember'),
                  onClick: onInviteMember,
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="tab-content-container space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('members.searchPlaceholder')}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm transition-colors bg-elevation-1 border-theme-subtle text-theme-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
          >
            {roleFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Invite Button */}
          {canInviteMembers && (
            <Button onClick={onInviteMember} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('members.inviteMember')}
            </Button>
          )}
        </div>
      </div>

      {/* Members Count */}
      <div className="text-sm text-theme-secondary">
        {filteredMembers.length === members.length
          ? t('members.showingAll', { count: members.length })
          : t('members.showingFiltered', { filtered: filteredMembers.length, total: members.length })}
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-theme-secondary">{t('members.noMatches')}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-theme-subtle divide-y divide-theme-subtle bg-card overflow-hidden">
          {filteredMembers.map((member) => {
            const role = getMemberRole(member);
            const isEditing = editingMemberId === (member.userId || (member as any).id);
            const canEdit = canEditThisMember(member);
            const canRemove = canRemoveThisMember(member);
            const avatarUrl = getMemberAvatar(member);
            const displayName = getMemberDisplayName(member);
            const email = getMemberEmail(member);
            const initials = getMemberInitials(member);
            const isYou = isCurrentUser(member);

            return (
              <div
                key={member.userId || (member as any).id}
                className="p-4 flex items-center justify-between transition-colors hover:bg-elevation-1 group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover border border-theme-subtle flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center bg-elevation-2 text-theme-primary font-medium flex-shrink-0 ${avatarUrl ? 'hidden' : ''}`}
                  >
                    {initials}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-theme-primary truncate">
                        {displayName}
                      </p>
                      {isYou && (
                        <Badge variant="default" className="text-xs">
                          {t('members.you')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3 text-theme-tertiary flex-shrink-0" />
                      <p className="text-xs text-theme-tertiary truncate">{email}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Role Badge/Selector */}
                  {isEditing && canEdit ? (
                    <select
                      value={role}
                      onChange={(e) => {
                        const newRole = e.target.value as ProjectRole | TeamRole;
                        handleRoleChange(member, newRole);
                      }}
                      onBlur={() => setEditingMemberId(null)}
                      autoFocus
                      className="px-3 py-1.5 rounded-lg border text-sm transition-colors bg-elevation-1 border-theme-subtle text-theme-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                      disabled={isUpdatingRole}
                    >
                      {availableRoles.map((r) => (
                        <option key={r} value={r}>
                          {formatRoleName(r)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      className={`flex items-center gap-1.5 ${canEdit ? 'cursor-pointer' : ''}`}
                      onClick={() => canEdit && setEditingMemberId(member.userId || (member as any).id)}
                      title={canEdit ? t('members.clickToChangeRole') : ''}
                    >
                      <Badge variant={getRoleColor(role)}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(role)}
                          {formatRoleName(role)}
                        </span>
                      </Badge>
                    </div>
                  )}

                  {/* Remove Button */}
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveClick(member)}
                      className="p-2 rounded-lg text-status-danger hover:bg-status-danger-bg transition-colors opacity-0 group-hover:opacity-100"
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
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'var(--overlay-bg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            onClick={() => setShowRemoveConfirm(null)}
          />
          <div
            className="relative w-full max-w-md rounded-lg shadow-xl border transition-colors modal-glass"
            style={{ borderColor: 'var(--border-subtle)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-theme-primary mb-2">
                {t('members.confirmRemove')}
              </h3>
              <p className="text-sm text-theme-secondary mb-6">
                {t('members.confirmRemoveDescription', { context: contextType })}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowRemoveConfirm(null)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmRemove}
                >
                  {t('members.remove')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MembersTab.displayName = 'MembersTab';

