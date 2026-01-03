import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  Folder,
  ArrowLeft,
  Activity,
  Clock,
  Settings as SettingsIcon,
  LayoutGrid,
  FileText,
  Key,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useNotifications } from '../contexts/NotificationContext';
import { updateTeamCache, updateTeamMemberCache } from '../utils/queryInvalidation';
import { useDebounce } from '../utils/debounce';
import { teamsService } from '../services/teams';
import { auditService } from '../services/audit';
import { projectsService } from '../services/projects';
import { useProjects } from '../hooks/useProjects';
import { useWorkflows } from '../hooks/useWorkflows';
import { usePreferences } from '../hooks/usePreferences';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { FilterConfig } from '../components/ui/FilterPanel';
import { PageHeader } from '../components/shared/PageHeader';
import { ProjectCard } from '../components/projects/ProjectCard';
import { TeamHeader } from '../components/teams/TeamHeader';
import { CreateTeamModal } from '../components/teams/CreateTeamModal';
import { AddMemberModal } from '../components/teams/AddMemberModal';
import { AddProjectModal } from '../components/teams/AddProjectModal';
import { MembersTab } from '../components/shared/MembersTab';
import { TeamSettingsTab } from '../components/teams/TeamSettingsTab';
import type { Team, TeamMember, TeamRole, TeamProject, AuditLog, Project, ProjectRole } from '../types';

const ACTION_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  // v3 actions
  SECRET_CREATE: 'success',
  SECRET_READ: 'info',
  SECRET_UPDATE: 'warning',
  SECRET_DELETE: 'danger',
  SECRET_ROTATE: 'warning',
  SECRET_MOVE: 'info',
  SECRET_COPY: 'info',
  PROJECT_CREATE: 'success',
  PROJECT_UPDATE: 'warning',
  PROJECT_ARCHIVE: 'warning',
  PROJECT_RESTORE: 'success',
  PROJECT_DELETE: 'danger',
  MEMBER_INVITE: 'info',
  MEMBER_JOIN: 'success',
  MEMBER_REMOVE: 'danger',
  MEMBER_ROLE_CHANGE: 'warning',
  WORKFLOW_CREATE: 'success',
  WORKFLOW_UPDATE: 'warning',
  WORKFLOW_DELETE: 'danger',
  TEAM_CREATE: 'success',
  TEAM_UPDATE: 'warning',
  TEAM_DELETE: 'danger',
  TEAM_MEMBER_ADD: 'success',
  TEAM_MEMBER_REMOVE: 'danger',
  TEAM_PROJECT_ADD: 'info',
  TEAM_PROJECT_REMOVE: 'warning',
  // Legacy actions
  CREATE: 'success',
  READ: 'info',
  UPDATE: 'warning',
  DELETE: 'danger',
  SHARE: 'info',
  ROTATE: 'warning',
  UNSHARE: 'warning',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  SECRET_CREATE: <Key className="h-4 w-4" />,
  SECRET_READ: <Key className="h-4 w-4" />,
  SECRET_UPDATE: <Key className="h-4 w-4" />,
  SECRET_DELETE: <Key className="h-4 w-4" />,
  SECRET_ROTATE: <Key className="h-4 w-4" />,
  PROJECT_CREATE: <Folder className="h-4 w-4" />,
  PROJECT_UPDATE: <Folder className="h-4 w-4" />,
  PROJECT_DELETE: <Folder className="h-4 w-4" />,
  MEMBER_INVITE: <Users className="h-4 w-4" />,
  MEMBER_JOIN: <Users className="h-4 w-4" />,
  MEMBER_REMOVE: <Users className="h-4 w-4" />,
  TEAM_CREATE: <Building2 className="h-4 w-4" />,
  TEAM_UPDATE: <Building2 className="h-4 w-4" />,
  TEAM_DELETE: <Building2 className="h-4 w-4" />,
  TEAM_MEMBER_ADD: <Users className="h-4 w-4" />,
  TEAM_MEMBER_REMOVE: <Users className="h-4 w-4" />,
  TEAM_PROJECT_ADD: <Folder className="h-4 w-4" />,
  TEAM_PROJECT_REMOVE: <Folder className="h-4 w-4" />,
};

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();
  
  // Persist activeTab in sessionStorage and URL query params
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL query params first
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      return tabFromUrl;
    }
    // Fallback to sessionStorage
    const saved = sessionStorage.getItem(`team-${teamId}-activeTab`);
    return saved || 'overview';
  });

  // Update sessionStorage and URL when tab changes
  useEffect(() => {
    if (teamId) {
      sessionStorage.setItem(`team-${teamId}-activeTab`, activeTab);
      // Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab, teamId]);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<string | null>(null);
  
  // Projects tab state
  const { projectView, setProjectView } = usePreferences();
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const debouncedProjectSearchTerm = useDebounce(projectSearchTerm, 300);
  const [projectFilters, setProjectFilters] = useState<Record<string, any>>({
    workflow: null,
    accessSource: null,
  });
  const [showArchived, setShowArchived] = useState(false);

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

  // Fetch team projects (for team-specific operations)
  const { data: teamProjects } = useQuery<TeamProject[]>({
    queryKey: ['teams', teamId, 'projects'],
    queryFn: () => teamsService.listTeamProjects(teamId!),
    enabled: !!teamId,
  });

  // Fetch all projects for the projects tab
  const { data: allProjectsData, isLoading: isAllProjectsLoading } = useProjects({
    search: debouncedProjectSearchTerm,
    includeArchived: showArchived,
  });

  // Fetch workflows for filtering
  const { data: workflows } = useWorkflows(user?.id);

  const canManageTeam = () => {
    return team?.currentUserRole === 'TEAM_OWNER' || team?.currentUserRole === 'TEAM_ADMIN';
  };

  // Fetch all projects the user has access to for activity
  const { data: allProjectsForActivity } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectsService.listProjects({ size: 1000 }),
    enabled: !!teamId && activeTab === 'activity',
    staleTime: 2 * 60 * 1000,
  });

  // Fetch all team activity from all projects
  const { data: activityData, isLoading: isActivityLoading } = useQuery<{
    logs: AuditLog[];
    totalCount: number;
  }>({
    queryKey: ['teams', teamId, 'activity', 'all', allProjectsForActivity?.content?.length],
    queryFn: async () => {
      if (!allProjectsForActivity?.content || allProjectsForActivity.content.length === 0) {
        return { logs: [], totalCount: 0 };
      }

      // Get all projects that belong to this team
      const teamProjectIds = teamProjects?.map(tp => tp.projectId) || [];
      
      // Fetch activities from all team projects in parallel
      const activityPromises = allProjectsForActivity.content
        .filter((project: Project) => teamProjectIds.includes(project.id))
        .map(async (project: Project) => {
          try {
            const response = await auditService.getProjectAuditLogs(project.id, {
              page: 0,
              size: 100, // Get more items per project
            });
            return response.content || [];
          } catch (err: any) {
            if (err.response?.status === 403 || err.response?.status === 404) {
              return [];
            }
            return [];
          }
        });

      const allActivities = await Promise.all(activityPromises);
      const flattened = allActivities.flat();

      // Sort by date (newest first)
      const sorted = flattened.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return { logs: sorted, totalCount: sorted.length };
    },
    enabled: !!teamId && activeTab === 'activity' && !!allProjectsForActivity?.content,
    staleTime: 5 * 60 * 1000, // 5 minutes - preserve audit data across sessions
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes even when not in use
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      teamsService.removeTeamMember(teamId, memberId),
    onMutate: async ({ memberId }) => {
      await queryClient.cancelQueries({ queryKey: ['teams', teamId, 'members'] });
      const previous = queryClient.getQueryData(['teams', teamId, 'members']);
      
      // Optimistically remove member
      updateTeamMemberCache(queryClient, teamId!, (members) =>
        members.filter(m => m.userId !== memberId)
      );
      
      // Update team member count
      const team = queryClient.getQueryData<Team>(['teams', teamId]);
      if (team) {
        updateTeamCache(queryClient, teamId!, {
          memberCount: Math.max(0, (team.memberCount || 1) - 1),
        });
      }
      
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['teams', teamId, 'members'], context.previous);
      }
      showNotification({
        type: 'error',
        title: 'Failed to remove member',
        message: 'An error occurred',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showNotification({
        type: 'success',
        title: 'Member removed',
        message: 'The member has been removed from the team',
      });
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: TeamRole }) =>
      teamsService.updateMemberRole(teamId!, memberId, { role }),
    onMutate: async ({ memberId, role }) => {
      await queryClient.cancelQueries({ queryKey: ['teams', teamId, 'members'] });
      const previous = queryClient.getQueryData(['teams', teamId, 'members']);
      
      // Optimistically update role
      updateTeamMemberCache(queryClient, teamId!, (members) =>
        members.map(m => m.userId === memberId ? { ...m, role } : m)
      );
      
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['teams', teamId, 'members'], context.previous);
      }
      setRoleChangeTarget(null);
      showNotification({
        type: 'error',
        title: 'Failed to update role',
        message: 'An error occurred',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      setRoleChangeTarget(null);
      showNotification({
        type: 'success',
        title: 'Role updated',
        message: 'The member role has been updated successfully',
      });
    },
  });

  // Handle member role change
  const handleMemberRoleChange = useCallback((memberId: string, newRole: TeamRole | ProjectRole) => {
    const member = members?.find((m) => m.userId === memberId);
    if (!member || member.role === newRole) return;
    setRoleChangeTarget(memberId);
    updateMemberRoleMutation.mutate({ memberId, role: newRole as TeamRole });
  }, [updateMemberRoleMutation, members]);

  // Handle remove member
  const handleRemoveMember = useCallback((memberId: string) => {
    removeMemberMutation.mutate({
      teamId: team!.id,
      memberId,
    });
  }, [removeMemberMutation, team]);

  // Get available roles based on current user role
  const availableRoles: TeamRole[] = useMemo(() => {
    if (team?.currentUserRole === 'TEAM_OWNER') {
      return ['TEAM_OWNER', 'TEAM_ADMIN', 'TEAM_MEMBER'];
    }
    return ['TEAM_ADMIN', 'TEAM_MEMBER'];
  }, [team?.currentUserRole]);

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


  const canDeleteTeam = () => {
    return team?.currentUserRole === 'TEAM_OWNER';
  };

  // Filter and enrich projects for the projects tab
  const filteredProjects = useMemo(() => {
    let projectList = allProjectsData?.content ?? [];
    
    // Filter to only show projects that belong to this team
    const teamProjectIds = teamProjects?.map(tp => tp.projectId) || [];
    projectList = projectList.filter((project: Project) => teamProjectIds.includes(project.id));

    // Enrich with workflow info
    if (workflows && workflows.length > 0) {
      projectList = projectList.map((project: Project) => {
        for (const workflow of workflows) {
          if (workflow.projects?.some(wp => wp.projectId === project.id)) {
            return {
              ...project,
              workflowId: workflow.id,
              workflowName: workflow.name,
            };
          }
        }
        return project;
      });
    }

    // Apply workflow filter
    if (projectFilters.workflow) {
      projectList = projectList.filter((project: Project) => project.workflowId === projectFilters.workflow);
    }

    // Apply access source filter
    if (projectFilters.accessSource) {
      projectList = projectList.filter((project: Project) => 
        project.accessSource === projectFilters.accessSource
      );
    }

    return projectList;
  }, [allProjectsData?.content, teamProjects, workflows, projectFilters.workflow, projectFilters.accessSource]);

  // Calculate total secrets from team projects
  const totalSecrets = useMemo(() => {
    if (!filteredProjects || filteredProjects.length === 0) return 0;
    return filteredProjects.reduce((total: number, project: Project) => {
      return total + (project.secretCount || 0);
    }, 0);
  }, [filteredProjects]);

  // Get recent projects for overview
  const recentProjects = useMemo(() => {
    if (!filteredProjects || filteredProjects.length === 0) return [];
    return [...filteredProjects]
      .sort((a: Project, b: Project) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [filteredProjects]);

  // Separate active and archived projects
  const { activeProjects, archivedProjects } = useMemo(() => {
    const active = filteredProjects.filter((p: Project) => !p.isArchived);
    const archived = filteredProjects.filter((p: Project) => p.isArchived);
    return { activeProjects: active, archivedProjects: archived };
  }, [filteredProjects]);

  const displayProjects = showArchived ? filteredProjects : activeProjects;

  const projectFilterConfigs: FilterConfig[] = useMemo(() => {
    const workflowOptions = workflows?.map(w => ({ label: w.name, value: w.id })) || [];
    return [
      {
        key: 'workflow',
        label: 'Workflow',
        type: 'select',
        options: workflowOptions,
        value: projectFilters.workflow,
      },
      {
        key: 'accessSource',
        label: 'Access Source',
        type: 'select',
        options: [
          { label: 'Direct', value: 'DIRECT' },
          { label: 'Team', value: 'TEAM' },
          { label: 'Both', value: 'BOTH' },
        ],
        value: projectFilters.accessSource,
      },
    ];
  }, [workflows, projectFilters]);

  const handleProjectFilterChange = (key: string, value: any) => {
    setProjectFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleProjectFilterClear = () => {
    setProjectFilters({ workflow: null, accessSource: null });
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('home.justNow');
    if (diffMins < 60) return t('home.timeAgo.minutes', { count: diffMins });
    if (diffHours < 24) return t('home.timeAgo.hours', { count: diffHours });
    if (diffDays < 7) return t('home.timeAgo.days', { count: diffDays });
    return then.toLocaleDateString();
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
          {t('teams.backToList')}
        </Button>
        <EmptyState
          icon={<Building2 className="h-16 w-16 text-theme-tertiary" />}
          title={t('teams.detail.notFoundTitle')}
          description={t('teams.detail.notFoundDescription')}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: t('teamDetail.overview'), icon: LayoutGrid },
    { id: 'members', label: t('teamDetail.members'), icon: Users, count: members?.length },
    { id: 'projects', label: t('teamDetail.projects'), icon: Folder, count: teamProjects?.length },
    { id: 'activity', label: t('teamDetail.activity'), icon: Activity },
    { id: 'settings', label: t('teamDetail.settings'), icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col min-h-0 w-full max-w-full">
      <div className="flex-shrink-0 pb-6">
        <TeamHeader
          team={team}
          activeTab={activeTab}
          canManageTeam={canManageTeam()}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 mb-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId);
          }}
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6 w-full pb-6">
            {/* Team Description */}
            {team.description && (
              <div className="card p-6">
                <h3 className="text-h3 font-semibold mb-3 text-theme-primary">About</h3>
                <p className="text-body-sm text-theme-secondary whitespace-pre-wrap">{team.description}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-elevation-1">
                    <Users className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme-secondary mb-1">
                      {t('teamDetail.membersCount')}
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme-secondary mb-1">
                      {t('teamDetail.projectsCount')}
                    </p>
                    <p className="text-3xl font-bold text-theme-primary">
                      {team.projectCount || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-elevation-1">
                    <Key className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme-secondary mb-1">
                      Total Secrets
                    </p>
                    <p className="text-3xl font-bold text-theme-primary">
                      {totalSecrets}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-h3 font-semibold text-theme-primary">Recent Projects</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('projects')}
                  >
                    View all
                  </Button>
                </div>
                <div className="space-y-3">
                  {recentProjects.map((project: Project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-4 rounded-lg border transition-colors hover:bg-elevation-1"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Folder className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                            <h4 className="text-body-sm font-semibold truncate text-theme-primary">
                              {project.name}
                            </h4>
                          </div>
                          {project.description && (
                            <p className="text-caption text-theme-secondary line-clamp-2 mb-2">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-caption text-theme-tertiary flex-wrap">
                            <span className="flex items-center gap-1">
                              <Key className="h-3 w-3" />
                              {project.secretCount || 0} secrets
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {project.memberCount || 0} members
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTimeAgo(project.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <MembersTab
            members={members}
            type="team"
            isLoading={isMembersLoading}
            currentUserId={user?.id}
            currentUserRole={(team?.currentUserRole as TeamRole) || 'TEAM_MEMBER'}
            canManageMembers={canManageTeam()}
            availableRoles={availableRoles}
            roleChangeTarget={roleChangeTarget}
            isUpdatingRole={updateMemberRoleMutation.isPending}
            onRoleChange={handleMemberRoleChange}
            onRemoveMember={handleRemoveMember}
            onInviteMember={() => setShowAddMemberModal(true)}
          />
        )}

      {activeTab === 'projects' && (
        <div className="space-y-6 pb-6">
          <PageHeader
            title="Projects"
            description="Manage team projects"
            view={projectView}
            onViewChange={setProjectView}
            onCreateNew={() => setShowAddProjectModal(true)}
            createButtonLabel="New Project"
            searchTerm={projectSearchTerm}
            onSearchChange={setProjectSearchTerm}
            searchPlaceholder="Search projects..."
            filters={projectFilterConfigs}
            filterValues={projectFilters}
            onFilterChange={handleProjectFilterChange}
            onFilterClear={handleProjectFilterClear}
            showArchivedToggle={true}
            showArchived={showArchived}
            onShowArchivedChange={setShowArchived}
          />

          {/* Projects Display */}
          {isAllProjectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-4 bg-elevation-1 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-elevation-1 rounded w-full mb-2"></div>
                  <div className="h-3 bg-elevation-1 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : displayProjects.length === 0 ? (
            <EmptyState
              icon={<Folder className="h-16 w-16 text-theme-tertiary" />}
              title={projectSearchTerm ? 'No projects match your search' : 'No projects'}
              description={
                projectSearchTerm
                  ? 'Try a different search term'
                  : canManageTeam()
                  ? 'Add projects to this team to share access with all team members'
                  : 'This team has no projects yet'
              }
              action={
                canManageTeam()
                  ? {
                      label: 'Add Project',
                      onClick: () => setShowAddProjectModal(true),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-6">
              {/* Active Projects */}
              {activeProjects.length > 0 && (
                <div>
                  {projectView === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeProjects.map((project: Project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          view="grid"
                          getTimeAgo={getTimeAgo}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeProjects.map((project: Project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          view="list"
                          getTimeAgo={getTimeAgo}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Archived Projects */}
              {showArchived && archivedProjects.length > 0 && (
                <div>
                  <div
                    className="pt-6 border-t mb-4"
                    style={{ borderTopColor: 'var(--border-subtle)' }}
                  >
                    <h3 className="text-sm font-semibold text-theme-secondary mb-4">Archived Projects</h3>
                  </div>
                  {projectView === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {archivedProjects.map((project: Project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          view="grid"
                          getTimeAgo={getTimeAgo}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {archivedProjects.map((project: Project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          view="list"
                          getTimeAgo={getTimeAgo}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

        {activeTab === 'activity' && (
          <div className="card w-full">
          <div className="padding-card border-b border-theme-subtle pb-4 mb-4">
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
          ) : isActivityLoading ? (
            <div className="padding-card flex justify-center">
              <Spinner size="md" />
            </div>
          ) : !activityData || !activityData.logs || activityData.logs.length === 0 ? (
            <div className="padding-card">
              <EmptyState
                icon={<Activity className="h-12 w-12 text-theme-tertiary" />}
                title="No activity"
                description="Team activity will appear here"
              />
            </div>
          ) : (
            <div className="rounded-lg border divide-y" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)', borderTopColor: 'var(--border-subtle)' }}>
              {activityData.logs.slice(0, 50).map((log: AuditLog) => {
                const actionColor = ACTION_COLORS[log.action] || 'default';
                const iconBgStyles = {
                  success: { backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)' },
                  danger: { backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)' },
                  warning: { backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning)' },
                  info: { backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info)' },
                  default: { backgroundColor: 'var(--elevation-1)', color: 'var(--text-secondary)' },
                };
                
                const formatAction = (action: string) => {
                  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                };

                const getTimeAgo = (timestamp: string) => {
                  const now = new Date();
                  const then = new Date(timestamp);
                  const diffMs = now.getTime() - then.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMs / 3600000);
                  const diffDays = Math.floor(diffMs / 86400000);

                  if (diffMins < 1) return t('home.justNow');
                  if (diffMins < 60) return t('home.timeAgo.minutes', { count: diffMins });
                  if (diffHours < 24) return t('home.timeAgo.hours', { count: diffHours });
                  if (diffDays < 7) return t('home.timeAgo.days', { count: diffDays });
                  return then.toLocaleDateString();
                };
                
                // Get project from log.project or lookup from allProjectsForActivity
                // Handle case where log.project might be empty string from API
                const project: Project | undefined = (log.project && typeof log.project === 'object' && 'id' in log.project ? log.project as Project : undefined) || 
                  (log.projectId ? allProjectsForActivity?.content?.find((p: Project) => p.id === log.projectId) : undefined);
                const projectName = project?.name || (log.metadata?.projectName as string | undefined);
                
                // Get team name(s) from project.teams or metadata
                let teamName: string | undefined;
                if (project?.teams && project.teams.length > 0) {
                  teamName = project.teams[0]?.teamName;
                } else if (log.metadata?.teamName) {
                  teamName = log.metadata.teamName as string;
                }
                
                return (
                  <div 
                    key={log.id} 
                    className="p-4 transition-colors"
                    style={{ borderTopColor: 'var(--border-subtle)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--elevation-1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg" style={iconBgStyles[actionColor]}>
                        {ACTION_ICONS[log.action] || <FileText className="h-4 w-4" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={actionColor}>
                            {formatAction(log.action)}
                          </Badge>
                          {log.resourceName && (
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {log.resourceName}
                            </span>
                          )}
                          {projectName && (
                            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                              in {projectName}
                            </span>
                          )}
                          {teamName && (
                            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                              (team: {teamName})
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          by {log.userDisplayName || log.userEmail || log.user?.email || 'Unknown'}
                        </p>
                      </div>
                      
                      <div className="flex items-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        <Clock className="h-4 w-4 mr-1" />
                        {getTimeAgo(log.createdAt || '')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

        {activeTab === 'settings' && canManageTeam() && team && (
          <TeamSettingsTab
            team={team}
            members={members}
            memberCount={team.memberCount}
            projectCount={team.projectCount}
            canManageTeam={canManageTeam()}
            canDeleteTeam={canDeleteTeam()}
            onAddMember={() => setShowAddMemberModal(true)}
            onRoleChange={handleMemberRoleChange}
            onRemoveMember={handleRemoveMember}
            onEditTeam={() => setShowEditModal(true)}
            onDeleteTeam={() => setShowDeleteConfirm(true)}
            roleChangeTarget={roleChangeTarget}
            isUpdatingRole={updateMemberRoleMutation.isPending}
          />
        )}

        {activeTab === 'settings' && !canManageTeam() && (
          <div className="card w-full">
            <div className="padding-card">
              <EmptyState
                icon={<SettingsIcon className="h-12 w-12 text-theme-tertiary" />}
                title="Settings not available"
                description="You need admin or owner permissions to manage team settings"
              />
            </div>
          </div>
        )}
      </div>

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

