import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  Crown,
  Shield,
  Mail,
  Trash2,
  Plus,
  X,
  Folder,
  ExternalLink,
  ArrowLeft,
  Edit,
  Search,
  ChevronDown,
  Activity,
  Clock,
  Settings as SettingsIcon,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { teamsService } from '../services/teams';
import { auditService } from '../services/audit';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { TeamHeader } from '../components/teams/TeamHeader';
import { CreateTeamModal } from '../components/teams/CreateTeamModal';
import { AddMemberModal } from '../components/teams/AddMemberModal';
import { AddProjectModal } from '../components/teams/AddProjectModal';
import type { Team, TeamMember, TeamRole, TeamProject, AuditLog } from '../types';

const ROLE_ICONS: Record<TeamRole, React.ReactNode> = {
  TEAM_OWNER: <Crown className="h-3 w-3" />,
  TEAM_ADMIN: <Shield className="h-3 w-3" />,
  TEAM_MEMBER: null,
};

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();
  
  // Persist activeTab in sessionStorage
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem(`team-${teamId}-activeTab`);
    return saved || 'overview';
  });

  // Update sessionStorage when tab changes
  useEffect(() => {
    if (teamId) {
      sessionStorage.setItem(`team-${teamId}-activeTab`, activeTab);
    }
  }, [activeTab, teamId]);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [editingMemberRole, setEditingMemberRole] = useState<{ memberId: string; role: TeamRole } | null>(null);

  // Fetch team details
  const { data: team, isLoading: isTeamLoading, error: teamError } = useQuery<Team>({
    queryKey: ['teams', teamId],
    queryFn: () => teamsService.getTeam(teamId!),
    enabled: !!teamId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch team members
  const { data: members, isLoading: isMembersLoading } = useQuery<TeamMember[]>({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () => teamsService.listTeamMembers(teamId!),
    enabled: !!teamId,
  });

  // Fetch team projects
  const { data: teamProjects, isLoading: isProjectsLoading } = useQuery<TeamProject[]>({
    queryKey: ['teams', teamId, 'projects'],
    queryFn: () => teamsService.listTeamProjects(teamId!),
    enabled: !!teamId,
  });

  const canManageTeam = () => {
    return team?.currentUserRole === 'TEAM_OWNER' || team?.currentUserRole === 'TEAM_ADMIN';
  };

  // Fetch team activity
  const { data: activityData } = useQuery({
    queryKey: ['teams', teamId, 'activity'],
    queryFn: () => auditService.listAuditLogs({ resourceType: 'TEAM', userId: teamId, size: 10 }),
    enabled: !!teamId && canManageTeam(),
    staleTime: 30 * 1000,
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: TeamRole }) =>
      teamsService.updateMemberRole(teamId!, memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      setEditingMemberRole(null);
      showNotification({
        type: 'success',
        title: 'Role updated',
        message: 'The member role has been updated successfully',
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Failed to update role',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    },
  });

  // Filter members by search term
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (!memberSearchTerm.trim()) return members;
    const search = memberSearchTerm.toLowerCase();
    return members.filter(member =>
      member.email.toLowerCase().includes(search) ||
      (member.displayName && member.displayName.toLowerCase().includes(search))
    );
  }, [members, memberSearchTerm]);

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => teamsService.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showNotification({
        type: 'success',
        title: 'Team deleted',
        message: 'The team has been deleted successfully',
      });
      navigate('/teams');
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Failed to delete team',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      teamsService.removeTeamMember(teamId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showNotification({
        type: 'success',
        title: 'Member removed',
        message: 'The member has been removed from the team',
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Failed to remove member',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    },
  });

  // Remove project mutation
  const removeProjectMutation = useMutation({
    mutationFn: ({ teamId, projectId }: { teamId: string; projectId: string }) =>
      teamsService.removeProjectFromTeam(teamId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showNotification({
        type: 'success',
        title: 'Project removed',
        message: 'The project has been removed from the team',
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Failed to remove project',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    },
  });

  const canDeleteTeam = () => {
    return team?.currentUserRole === 'TEAM_OWNER';
  };

  if (isTeamLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="space-y-6">
        <Button variant="secondary" onClick={() => navigate('/teams')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teams
        </Button>
        <EmptyState
          icon={<Building2 className="h-16 w-16 text-theme-tertiary" />}
          title="Team not found"
          description="The team you're looking for doesn't exist or you don't have access to it."
        />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'members', label: 'Members', icon: Users, count: members?.length },
    { id: 'projects', label: 'Projects', icon: Folder, count: teamProjects?.length },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      <TeamHeader
        team={team}
        activeTab={activeTab}
        canManageTeam={canManageTeam()}
        onTabChange={setActiveTab}
      />

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId);
        }}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-elevation-1">
                  <Users className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <p className="text-sm text-theme-secondary mb-1">
                    Members
                  </p>
                  <p className="text-3xl font-bold text-theme-primary">
                    {team.memberCount || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-elevation-1">
                  <Folder className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <p className="text-sm text-theme-secondary mb-1">
                    Projects
                  </p>
                  <p className="text-3xl font-bold text-theme-primary">
                    {team.projectCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card">
        <div className="padding-card border-b border-theme-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-theme-primary">
              Members ({members?.length || 0})
            </h2>
            <div className="flex items-center gap-3">
              {members && members.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
                  <input
                    type="text"
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    placeholder="Search members..."
                    className="pl-9 pr-3 py-1.5 text-sm border rounded-lg transition-colors"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  />
                </div>
              )}
              {canManageTeam() && (
                <Button size="sm" onClick={() => setShowAddMemberModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Member
                </Button>
              )}
            </div>
          </div>
        </div>

        {isMembersLoading ? (
          <div className="padding-card flex justify-center">
            <Spinner size="md" />
          </div>
        ) : !members || members.length === 0 ? (
          <div className="padding-card">
            <EmptyState
              icon={<Users className="h-12 w-12 text-theme-tertiary" />}
              title="No members"
              description="Add members to start collaborating"
            />
          </div>
        ) : (
          <div className="divide-y divide-theme-subtle">
            {filteredMembers.length === 0 ? (
              <div className="padding-card text-center text-theme-tertiary text-sm">
                {memberSearchTerm ? 'No members match your search' : 'No members'}
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isEditing = editingMemberRole?.memberId === member.userId;
                const canChangeRole = canManageTeam() && 
                  member.userId !== user?.id &&
                  (team?.currentUserRole === 'TEAM_OWNER' || member.role !== 'TEAM_OWNER');
                
                return (
                  <div
                    key={member.id}
                    className="padding-card flex items-center justify-between hover:bg-elevation-1 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-elevation-1 text-theme-primary font-medium flex-shrink-0">
                        <span>
                          {(member.displayName || member.email || 'U')
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-theme-primary truncate">
                          {member.displayName || member.email}
                          {member.userId === user?.id && (
                            <span className="ml-2 text-xs text-theme-secondary">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-xs flex items-center gap-1 text-theme-secondary truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <div className="relative">
                          <select
                            value={editingMemberRole?.role || member.role}
                            onChange={(e) => {
                              const newRole = e.target.value as TeamRole;
                              updateMemberRoleMutation.mutate({
                                memberId: member.userId,
                                role: newRole,
                              });
                            }}
                            className="text-xs px-2 py-1 border rounded transition-colors"
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-primary)',
                            }}
                            onBlur={() => setEditingMemberRole(null)}
                            autoFocus
                          >
                            {team?.currentUserRole === 'TEAM_OWNER' && (
                              <option value="TEAM_OWNER">Owner</option>
                            )}
                            <option value="TEAM_ADMIN">Admin</option>
                            <option value="TEAM_MEMBER">Member</option>
                          </select>
                        </div>
                      ) : (
                        <>
                          <div
                            className="cursor-pointer inline-block"
                            onClick={() => canChangeRole && setEditingMemberRole({ memberId: member.userId, role: member.role })}
                            title={canChangeRole ? 'Click to change role' : ''}
                          >
                            <Badge
                              variant={
                                member.role === 'TEAM_OWNER' || member.role === 'TEAM_ADMIN'
                                  ? 'owner-admin'
                                  : 'default'
                              }
                            >
                              {ROLE_ICONS[member.role] && <span className="mr-1">{ROLE_ICONS[member.role]}</span>}
                              {member.role.replace('TEAM_', '')}
                              {canChangeRole && <ChevronDown className="h-3 w-3 ml-1 inline" />}
                            </Badge>
                          </div>
                          {canManageTeam() && member.userId !== user?.id && (
                            <button
                              onClick={() =>
                                removeMemberMutation.mutate({
                                  teamId: team.id,
                                  memberId: member.userId,
                                })
                              }
                              className="p-2 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                              title="Remove member"
                              disabled={removeMemberMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="card">
          <div className="padding-card border-b border-theme-subtle">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-theme-primary">
                Projects ({teamProjects?.length || 0})
              </h2>
              {canManageTeam() && (
                <Button size="sm" variant="secondary" onClick={() => setShowAddProjectModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Project
                </Button>
              )}
            </div>
          </div>

        {isProjectsLoading ? (
          <div className="padding-card flex justify-center">
            <Spinner size="md" />
          </div>
        ) : !teamProjects || teamProjects.length === 0 ? (
          <div className="padding-card">
            <EmptyState
              icon={<Folder className="h-12 w-12 text-theme-tertiary" />}
              title="No projects"
              description="Add projects to this team to share access with all team members"
            />
          </div>
        ) : (
          <div className="divide-y divide-theme-subtle">
            {teamProjects.map((teamProject) => (
              <div
                key={teamProject.id}
                className="padding-card flex items-center justify-between hover:bg-elevation-1 transition-colors"
              >
                <Link
                  to={`/projects/${teamProject.projectId}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="p-2 rounded-lg bg-elevation-1">
                    <Folder className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-primary">
                      {teamProject.projectName}
                    </p>
                    {teamProject.projectDescription && (
                      <p className="text-xs text-theme-secondary">
                        {teamProject.projectDescription}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-theme-tertiary" />
                </Link>
                {canManageTeam() && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeProjectMutation.mutate({
                        teamId: team.id,
                        projectId: teamProject.projectId,
                      });
                    }}
                    className="ml-2 p-2 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                    title="Remove project"
                    disabled={removeProjectMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <div className="padding-card border-b border-theme-subtle">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </h2>
              <Link
                to="/activity"
                className="text-sm font-medium transition-colors flex items-center gap-1"
                style={{ color: 'var(--accent-primary)' }}
              >
                View all
              </Link>
            </div>
          </div>
          {!canManageTeam() ? (
            <div className="padding-card">
              <EmptyState
                icon={<Activity className="h-12 w-12 text-theme-tertiary" />}
                title="Activity not available"
                description="You need admin or owner permissions to view team activity"
              />
            </div>
          ) : !activityData || !activityData.content || activityData.content.length === 0 ? (
            <div className="padding-card">
              <EmptyState
                icon={<Activity className="h-12 w-12 text-theme-tertiary" />}
                title="No activity"
                description="Team activity will appear here"
              />
            </div>
          ) : (
            <div className="divide-y divide-theme-subtle">
              {activityData.content.slice(0, 10).map((log: AuditLog) => {
                const userName = log.userDisplayName || log.userEmail || 'System';
                const userInitials = userName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                
                return (
                  <div key={log.id} className="padding-card">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-elevation-1 text-theme-primary font-medium text-xs flex-shrink-0">
                        {userInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-theme-primary">
                          <span className="font-medium">{userName}</span>
                          {' '}
                          {log.action.replace(/_/g, ' ').toLowerCase()}
                          {' '}
                          {log.resourceName && (
                            <span style={{ color: 'var(--accent-primary)' }}>
                              {log.resourceName}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-theme-tertiary mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="card">
        <div className="padding-card border-b border-theme-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-theme-primary">
              Projects ({teamProjects?.length || 0})
            </h2>
            {canManageTeam() && (
              <Button size="sm" variant="secondary" onClick={() => setShowAddProjectModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Project
              </Button>
            )}
          </div>
        </div>

        {isProjectsLoading ? (
          <div className="padding-card flex justify-center">
            <Spinner size="md" />
          </div>
        ) : !teamProjects || teamProjects.length === 0 ? (
          <div className="padding-card">
            <EmptyState
              icon={<Folder className="h-12 w-12 text-theme-tertiary" />}
              title="No projects"
              description="Add projects to this team to share access with all team members"
            />
          </div>
        ) : (
          <div className="divide-y divide-theme-subtle">
            {teamProjects.map((teamProject) => (
              <div
                key={teamProject.id}
                className="padding-card flex items-center justify-between hover:bg-elevation-1 transition-colors"
              >
                <Link
                  to={`/projects/${teamProject.projectId}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="p-2 rounded-lg bg-elevation-1">
                    <Folder className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-primary">
                      {teamProject.projectName}
                    </p>
                    {teamProject.projectDescription && (
                      <p className="text-xs text-theme-secondary">
                        {teamProject.projectDescription}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-theme-tertiary" />
                </Link>
                {canManageTeam() && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeProjectMutation.mutate({
                        teamId: team.id,
                        projectId: teamProject.projectId,
                      });
                    }}
                    className="ml-2 p-2 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                    title="Remove project"
                    disabled={removeProjectMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <div className="padding-card border-b border-theme-subtle">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </h2>
              <Link
                to="/activity"
                className="text-sm font-medium transition-colors flex items-center gap-1"
                style={{ color: 'var(--accent-primary)' }}
              >
                View all
              </Link>
            </div>
          </div>
          {!canManageTeam() ? (
            <div className="padding-card">
              <EmptyState
                icon={<Activity className="h-12 w-12 text-theme-tertiary" />}
                title="Activity not available"
                description="You need admin or owner permissions to view team activity"
              />
            </div>
          ) : !activityData || !activityData.content || activityData.content.length === 0 ? (
            <div className="padding-card">
              <EmptyState
                icon={<Activity className="h-12 w-12 text-theme-tertiary" />}
                title="No activity"
                description="Team activity will appear here"
              />
            </div>
          ) : (
            <div className="divide-y divide-theme-subtle">
              {activityData.content.slice(0, 10).map((log: AuditLog) => {
                const userName = log.userDisplayName || log.userEmail || 'System';
                const userInitials = userName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                
                return (
                  <div key={log.id} className="padding-card">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-elevation-1 text-theme-primary font-medium text-xs flex-shrink-0">
                        {userInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-theme-primary">
                          <span className="font-medium">{userName}</span>
                          {' '}
                          {log.action.replace(/_/g, ' ').toLowerCase()}
                          {' '}
                          {log.resourceName && (
                            <span style={{ color: 'var(--accent-primary)' }}>
                              {log.resourceName}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-theme-tertiary mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && canManageTeam() && (
        <div className="card">
          <div className="padding-card border-b border-theme-subtle">
            <h2 className="text-lg font-semibold text-theme-primary">Team Settings</h2>
          </div>
          <div className="padding-card space-y-6">
            <div>
              <h3 className="text-sm font-medium text-theme-primary mb-2">Team Management</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" onClick={() => setShowEditModal(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Team
                </Button>
                {canDeleteTeam() && (
                  <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Team
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && !canManageTeam() && (
        <div className="card">
          <div className="padding-card">
            <EmptyState
              icon={<SettingsIcon className="h-12 w-12 text-theme-tertiary" />}
              title="Settings not available"
              description="You need admin or owner permissions to manage team settings"
            />
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {team && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          teamId={team.id}
          canAssignOwner={team.currentUserRole === 'TEAM_OWNER'}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['teams', team.id, 'members'] });
            queryClient.invalidateQueries({ queryKey: ['teams', team.id] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
          }}
        />
      )}

      {/* Add Project Modal */}
      {team && (
        <AddProjectModal
          isOpen={showAddProjectModal}
          onClose={() => setShowAddProjectModal(false)}
          teamId={team.id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['teams', team.id, 'projects'] });
            queryClient.invalidateQueries({ queryKey: ['teams', team.id] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          }}
        />
      )}

      {/* Edit Team Modal - Reuse CreateTeamModal with edit mode */}
      {team && showEditModal && (
        <CreateTeamModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          team={team}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['teams', team.id] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            setShowEditModal(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Team"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-theme-primary">
            Are you sure you want to delete <strong>{team.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-theme-subtle">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteTeamMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => team && deleteTeamMutation.mutate(team.id)}
              isLoading={deleteTeamMutation.isPending}
            >
              Delete Team
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

