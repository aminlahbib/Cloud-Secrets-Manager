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
  ArrowLeft,
  Edit,
  Search,
  ChevronDown,
  Activity,
  Clock,
  Settings as SettingsIcon,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
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
import { FilterPanel, FilterConfig } from '../components/ui/FilterPanel';
import { ProjectCard } from '../components/projects/ProjectCard';
import { TeamHeader } from '../components/teams/TeamHeader';
import { CreateTeamModal } from '../components/teams/CreateTeamModal';
import { AddMemberModal } from '../components/teams/AddMemberModal';
import { AddProjectModal } from '../components/teams/AddProjectModal';
import type { Team, TeamMember, TeamRole, TeamProject, AuditLog, Project } from '../types';

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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
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
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
                <input
                  type="text"
                  value={projectSearchTerm}
                  onChange={(e) => setProjectSearchTerm(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-primary-glow)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProjectView('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    projectView === 'grid' ? 'bg-elevation-1' : ''
                  }`}
                  style={{
                    color: projectView === 'grid' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setProjectView('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    projectView === 'list' ? 'bg-elevation-1' : ''
                  }`}
                  style={{
                    color: projectView === 'list' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              {canManageTeam() && (
                <Button size="sm" onClick={() => setShowAddProjectModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Project
                </Button>
              )}
            </div>
            <FilterPanel
              filters={projectFilterConfigs}
              values={projectFilters}
              onChange={handleProjectFilterChange}
              onClear={handleProjectFilterClear}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Show archived
                  </span>
                  <div
                    className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors cursor-pointer"
                    style={{
                      backgroundColor: showArchived ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    }}
                    onClick={() => setShowArchived(!showArchived)}
                  >
                    <span
                      className={`inline-block w-4 h-4 bg-white rounded-full transform transition-transform ${
                        showArchived ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

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
            <div className="divide-y divide-theme-subtle">
              {activityData.logs.slice(0, 50).map((log: AuditLog) => {
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

