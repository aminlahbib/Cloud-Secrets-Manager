import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Key,
  Users,
  Settings as SettingsIcon,
  Activity,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Shield,
  Crown,
  UserPlus,
  Mail,
  Clock,
  BarChart3,
  List,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { projectsService } from '../services/projects';
import { secretsService } from '../services/secrets';
import { membersService } from '../services/members';
import { auditService, type AuditLogsResponse } from '../services/audit';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { useAuth } from '../contexts/AuthContext';
import type { Project, Secret, ProjectMember, ProjectRole, AuditLog } from '../types';
import { StatsCards } from '../components/analytics/StatsCards';
import { ActivityChart } from '../components/analytics/ActivityChart';
import { ActionDistributionChart } from '../components/analytics/ActionDistributionChart';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Skeleton, SkeletonTable, SkeletonStats } from '../components/ui/Skeleton';
import { SecretCard } from '../components/ui/SecretCard';
import {
  getLastNDays,
  prepareChartData,
  formatActionName,
} from '../utils/analytics';

const ROLE_COLORS: Record<ProjectRole, 'danger' | 'warning' | 'info' | 'default'> = {
  OWNER: 'danger',
  ADMIN: 'warning',
  MEMBER: 'info',
  VIEWER: 'default',
};

const ROLE_ICONS: Record<ProjectRole, React.ReactNode> = {
  OWNER: <Crown className="h-3 w-3 mr-1" />,
  ADMIN: <Shield className="h-3 w-3 mr-1" />,
  MEMBER: null,
  VIEWER: null,
};

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Persist activeTab in sessionStorage to prevent reset on errors
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem(`project-${projectId}-activeTab`);
    return saved || 'secrets';
  });

  // Update sessionStorage when tab changes
  useEffect(() => {
    if (projectId) {
      sessionStorage.setItem(`project-${projectId}-activeTab`, activeTab);
    }
  }, [activeTab, projectId]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteSecretModal, setShowDeleteSecretModal] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('MEMBER');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string>('');
  const [roleChangeTarget, setRoleChangeTarget] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityView, setActivityView] = useState<'analytics' | 'list'>('analytics');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch project details
  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getProject(projectId!),
    enabled: !!projectId,
  });

  // Fetch secrets
  const { data: secretsData, isLoading: isSecretsLoading } = useQuery({
    queryKey: ['project-secrets', projectId, searchTerm],
    queryFn: () => secretsService.listProjectSecrets(projectId!, { keyword: searchTerm || undefined }),
    enabled: !!projectId && activeTab === 'secrets',
  });

  // Fetch members
  const { data: members, isLoading: isMembersLoading } = useQuery<ProjectMember[]>({
    queryKey: ['project-members', projectId],
    queryFn: () => membersService.listMembers(projectId!),
    enabled: !!projectId,
  });

  // Calculate date range for analytics
  const getDateRangeParams = () => {
    if (dateRange === 'all') return {};
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  // Fetch project activity logs for list view (paginated)
  const { data: activityData, isLoading: isActivityLoading, error: activityError } = useQuery<AuditLogsResponse>({
    queryKey: ['project-activity', projectId, activityPage],
    queryFn: () => auditService.getProjectAuditLogs(projectId!, { page: activityPage - 1, size: 20 }),
    enabled: !!projectId && activeTab === 'activity' && activityView === 'list',
    retry: false,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch analytics using server-side aggregation
  const { data: analyticsData, isLoading: isAnalyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['project-activity-analytics', projectId, dateRange],
    queryFn: () => {
      const dateParams = getDateRangeParams();
      if (!dateParams.startDate || !dateParams.endDate) {
        throw new Error('Date range is required for analytics');
      }
      return auditService.getProjectAnalytics(projectId!, dateParams.startDate, dateParams.endDate);
    },
    enabled: !!projectId && activeTab === 'activity' && activityView === 'analytics',
    retry: false,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Transform server-side analytics to match frontend format
  const analyticsStats = useMemo(() => {
    if (!analyticsData) return null;
    try {
      // Server returns data in the same format as calculateActivityStats
      // Just need to ensure topUsers has the right structure
      return {
        totalActions: analyticsData.totalActions || 0,
        actionsByType: analyticsData.actionsByType || {},
        actionsByUser: analyticsData.actionsByUser || {},
        actionsByDay: analyticsData.actionsByDay || {},
        topActions: analyticsData.topActions || [],
        topUsers: analyticsData.topUsers || [],
      };
    } catch (error) {
      console.error('Error processing analytics stats:', error);
      return null;
    }
  }, [analyticsData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analyticsStats) return [];
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const dayKeys = getLastNDays(days);
    return prepareChartData(analyticsStats.actionsByDay, dayKeys);
  }, [analyticsStats, dateRange]);

  // Delete secret mutation with optimistic update
  const deleteSecretMutation = useMutation({
    mutationFn: (key: string) => secretsService.deleteProjectSecret(projectId!, key),
    onMutate: async (key) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['project-secrets', projectId] });

      // Snapshot previous value
      const previousSecrets = queryClient.getQueryData(['project-secrets', projectId]);

      // Optimistically update
      queryClient.setQueryData(['project-secrets', projectId], (old: any) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.filter((secret: Secret) => secret.secretKey !== key),
        };
      });

      return { previousSecrets };
    },
    onError: (_err, _key, context) => {
      // Rollback on error
      if (context?.previousSecrets) {
        queryClient.setQueryData(['project-secrets', projectId], context.previousSecrets);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowDeleteSecretModal(null);
    },
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: () => membersService.inviteMember(projectId!, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => membersService.removeMember(projectId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
      membersService.updateMemberRole(projectId!, userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: () => membersService.transferOwnership(projectId!, { newOwnerUserId: transferTarget }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowTransferModal(false);
      setTransferTarget('');
    },
  });

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || '');
    }
  }, [project]);

  useEffect(() => {
    if (!showTransferModal) {
      setTransferTarget('');
    }
  }, [showTransferModal]);

  const ownerCount = members?.filter((member) => member.role === 'OWNER').length ?? 0;
  const currentUserRole = project?.currentUserRole;
  const canManageSecrets = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN' || currentUserRole === 'MEMBER';
  const canDeleteSecrets = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canManageMembers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canManageProject = currentUserRole === 'OWNER';
  const isSoleOwner = currentUserRole === 'OWNER' && ownerCount <= 1;
  const canLeaveProject =
    !currentUserRole ? false : currentUserRole !== 'OWNER' ? true : ownerCount > 1;

  const secrets = secretsData?.content ?? [];
  const transferableMembers = useMemo(
    () => (members || []).filter((member) => member.userId !== user?.id),
    [members, user?.id]
  );
  const handleMemberRoleChange = useCallback((member: ProjectMember, newRole: ProjectRole) => {
    if (member.role === newRole) return;
    setRoleChangeTarget(member.userId);
    updateMemberRoleMutation.mutate(
      { userId: member.userId, role: newRole },
      {
        onSettled: () => setRoleChangeTarget(null),
      }
    );
  }, [updateMemberRoleMutation]);
  const availableRoleOptions: ProjectRole[] =
    currentUserRole === 'OWNER' ? ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] : ['ADMIN', 'MEMBER', 'VIEWER'];

  const canEditMemberRole = (member: ProjectMember) => {
    if (!canManageMembers) return false;
    if (member.userId === user?.id) return false;
    if (member.role === 'OWNER' && (currentUserRole !== 'OWNER' || ownerCount <= 1)) return false;
    return true;
  };

  const isArchived = project?.isArchived || Boolean(project?.deletedAt);
  const metaPairs = useMemo(() => {
    if (!project) return [];
    return [
      { label: 'Created', value: new Date(project.createdAt).toLocaleDateString() },
      { label: 'Updated', value: new Date(project.updatedAt).toLocaleDateString() },
      { label: 'Secrets', value: project.secretCount ?? 0 },
      { label: 'Members', value: project.memberCount ?? 0 },
    ];
  }, [project]);

  const hasFormChanges =
    canManageProject &&
    project &&
    (projectName.trim() !== project.name || (projectDescription || '').trim() !== (project.description || ''));

  const updateProjectMutation = useMutation({
    mutationFn: () =>
      projectsService.updateProject(projectId!, {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: () => projectsService.archiveProject(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowArchiveModal(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsService.deleteProjectPermanently(projectId!),
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowDeleteProjectModal(false);
      navigate('/projects');
    },
  });

  const restoreProjectMutation = useMutation({
    mutationFn: () => projectsService.restoreProject(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowRestoreModal(false);
    },
  });

  const leaveProjectMutation = useMutation({
    mutationFn: () => projectsService.leaveProject(projectId!),
    onSuccess: () => {
      setShowLeaveModal(false);
      navigate('/projects');
    },
  });

  if (isProjectLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Project Not Found</h2>
          <p className="text-sm text-red-700 mb-4">
            This project may have been deleted or you don't have access to it.
          </p>
          <Button variant="secondary" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'secrets', label: 'Secrets', icon: Key, count: project.secretCount },
    { id: 'members', label: 'Members', icon: Users, count: project.memberCount },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                {currentUserRole && (
                  <Badge variant={ROLE_COLORS[currentUserRole]}>
                    {ROLE_ICONS[currentUserRole]}
                    {currentUserRole}
                  </Badge>
                )}
                {project.isArchived && <Badge variant="warning">Archived</Badge>}
              </div>
              {project.description && <p className="mt-1 text-gray-500">{project.description}</p>}
            </div>

            <div className="flex gap-2">
              {activeTab === 'secrets' && canManageSecrets && (
                <Button onClick={() => navigate(`/projects/${projectId}/secrets/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Secret
                </Button>
              )}

              {activeTab === 'members' && canManageMembers && (
                <Button onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-4 text-sm text-neutral-600">
            <p>
              Need help?{' '}
              <button className="underline" type="button" onClick={() => setActiveTab('activity')}>
                View project activity
              </button>{' '}
              or visit{' '}
              <button className="underline" type="button" onClick={() => setActiveTab('settings')}>
                project settings
              </button>{' '}
              for more tools.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId);
        }}
      />

      {/* Tab Content */}
      {activeTab === 'secrets' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search secrets..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
            />
          </div>

          {isSecretsLoading ? (
            <SkeletonTable rows={5} cols={6} />
          ) : secrets.length === 0 ? (
            <EmptyState
              icon={<Key className="h-16 w-16 text-gray-400" />}
              title={searchTerm ? 'No secrets match your search' : 'No secrets yet'}
              description={
                searchTerm
                  ? 'Try a different search term'
                  : 'Add your first secret to this project'
              }
              action={
                canManageSecrets
                  ? {
                    label: 'Add Secret',
                    onClick: () => navigate(`/projects/${projectId}/secrets/new`),
                  }
                  : undefined
              }
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {secrets.map((secret: Secret) => {
                      const isExpired =
                        secret.expired || (secret.expiresAt && new Date(secret.expiresAt) < new Date());
                      const versionList = secret.secretVersions;
                      const lastVersionEntry =
                        versionList && versionList.length > 0 ? versionList[versionList.length - 1] : undefined;
                      const versionNumber = secret.version ?? lastVersionEntry?.versionNumber ?? 1;
                      const lastChangeDate = lastVersionEntry?.createdAt ?? secret.updatedAt;
                      const lastChangeUser =
                        lastVersionEntry?.creator?.displayName ||
                        lastVersionEntry?.creator?.email ||
                        secret.creator?.displayName ||
                        secret.creator?.email;
                      const historyLink = `/projects/${projectId}/secrets/${encodeURIComponent(
                        secret.secretKey
                      )}#versions`;

                      return (
                        <tr key={secret.id || secret.secretKey} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`}
                              className="text-sm font-medium text-neutral-900 hover:underline"
                            >
                              {secret.secretKey}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(secret.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{new Date(lastChangeDate).toLocaleDateString()}</div>
                            {lastChangeUser && <div className="text-xs text-gray-500">by {lastChangeUser}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">v{versionNumber}</div>
                            <Link to={historyLink} className="text-xs text-neutral-500 hover:text-neutral-900">
                              View history
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isExpired ? (
                              <Badge variant="danger">Expired</Badge>
                            ) : secret.expiresAt ? (
                              <Badge variant="warning">
                                Expires {new Date(secret.expiresAt).toLocaleDateString()}
                              </Badge>
                            ) : (
                              <Badge variant="default">Active</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageSecrets && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}/edit`)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteSecrets && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteSecretModal(secret.secretKey)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {secrets.map((secret: Secret) => (
                  <SecretCard
                    key={secret.id || secret.secretKey}
                    secret={secret}
                    projectId={projectId!}
                    canManageSecrets={canManageSecrets}
                    canDeleteSecrets={canDeleteSecrets}
                    onView={() => navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`)}
                    onEdit={() => navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}/edit`)}
                    onDelete={() => setShowDeleteSecretModal(secret.secretKey)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          {isMembersLoading && activeTab === 'members' ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : !members || members.length === 0 ? (
            <EmptyState
              icon={<Users className="h-16 w-16 text-gray-400" />}
              title="No members"
              description="Invite team members to collaborate on this project"
              action={
                canManageMembers
                  ? {
                    label: 'Invite Member',
                    onClick: () => setShowInviteModal(true),
                  }
                  : undefined
              }
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                      <span className="text-neutral-700 font-medium">
                        {(member.user?.displayName || member.user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user?.displayName || member.user?.email}
                        {member.userId === user?.id && (
                          <span className="ml-2 text-xs text-gray-400">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {canEditMemberRole(member) ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleMemberRoleChange(member, e.target.value as ProjectRole)}
                        className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        disabled={roleChangeTarget === member.userId && updateMemberRoleMutation.isPending}
                      >
                        {availableRoleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role.charAt(0) + role.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant={ROLE_COLORS[member.role]}>
                        {ROLE_ICONS[member.role]}
                        {member.role}
                      </Badge>
                    )}
                    {canManageMembers && member.userId !== user?.id && member.role !== 'OWNER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.userId)}
                        isLoading={removeMemberMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <ErrorBoundary
          resetKeys={[projectId || '', activityView]}
          fallback={
            <Card className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-2">Error loading activity tab</p>
                <p className="text-sm text-gray-500 mb-4">
                  There was an error displaying the activity tab. Please try refreshing the page.
                </p>
                <Button onClick={() => window.location.reload()}>Refresh Page</Button>
              </div>
            </Card>
          }
        >
          <div className="space-y-6">
            {/* Header with view toggle and date filter */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Project Activity</h2>
              <div className="flex items-center gap-3">
                {/* Date Range Filter (only for analytics) */}
                {activityView === 'analytics' && (
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
                      className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="all">All time</option>
                    </select>
                  </div>
                )}

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={activityView === 'analytics' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setActivityView('analytics')}
                    className="!m-0"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                  <Button
                    variant={activityView === 'list' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setActivityView('list')}
                    className="!m-0"
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                </div>
              </div>
            </div>

            {/* Analytics View */}
            {activityView === 'analytics' && (
              <>
                {isAnalyticsLoading ? (
                  <div className="space-y-6">
                    <SkeletonStats />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <Skeleton variant="text" width="40%" height={24} className="mb-4" />
                        <Skeleton variant="rectangular" width="100%" height={300} />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <Skeleton variant="text" width="40%" height={24} className="mb-4" />
                        <Skeleton variant="rectangular" width="100%" height={300} />
                      </div>
                    </div>
                  </div>
                ) : analyticsError ? (
                  <Card className="p-6">
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {analyticsError instanceof Error
                          ? analyticsError.message
                          : 'An error occurred while loading analytics. Please try again.'}
                      </p>
                      {(analyticsError as any)?.isPermissionError && (
                        <p className="text-xs text-gray-500 mb-4">
                          You may not have permission to view analytics for this project.
                        </p>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.location.reload()}
                      >
                        Refresh Page
                      </Button>
                    </div>
                  </Card>
                ) : !analyticsStats ? (
                  <Card className="p-6">
                    <EmptyState
                      icon={<Activity className="h-16 w-16 text-gray-400" />}
                      title="No Activity"
                      description="Activity for this project will appear here as actions are performed"
                    />
                  </Card>
                ) : (() => {
                  try {
                    if (!analyticsStats) {
                      return (
                        <Card className="p-6">
                          <EmptyState
                            icon={<Activity className="h-16 w-16 text-gray-400" />}
                            title="No Activity"
                            description="Activity for this project will appear here as actions are performed"
                          />
                        </Card>
                      );
                    }
                    return (
                      <div className="space-y-6">
                        {/* Stats Cards */}
                        <StatsCards stats={analyticsStats} />

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <ActivityChart data={chartData} title="Activity Over Time" type="line" />
                          <ActionDistributionChart
                            actionsByType={analyticsStats.actionsByType}
                            title="Actions Distribution"
                          />
                        </div>

                        {/* Top Users and Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Top Users */}
                          <Card className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
                            {analyticsStats.topUsers.length === 0 ? (
                              <p className="text-gray-500 text-sm">No user data available</p>
                            ) : (
                              <div className="space-y-3">
                                {analyticsStats.topUsers.map((user: { userId: string; email?: string; count: number }, index: number) => (
                                  <div key={user.userId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {user.email || 'Unknown User'}
                                        </p>
                                        <p className="text-xs text-gray-500">{user.count} actions</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>

                          {/* Top Actions */}
                          <Card className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Actions</h3>
                            {analyticsStats.topActions.length === 0 ? (
                              <p className="text-gray-500 text-sm">No action data available</p>
                            ) : (
                              <div className="space-y-3">
                                {analyticsStats.topActions.map((action: { action: string; count: number }, index: number) => (
                                  <div key={action.action} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {formatActionName(action.action)}
                                        </p>
                                        <p className="text-xs text-gray-500">{action.count} occurrences</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>
                        </div>
                      </div>
                    );
                  } catch (error) {
                    // console.error('Error rendering analytics:', error);

                    return (
                      <Card className="p-6">
                        <div className="text-center">
                          <p className="text-red-600 mb-2">Error rendering analytics</p>
                          <p className="text-sm text-gray-500">{String(error)}</p>
                        </div>
                      </Card>
                    );
                  }
                })()}
              </>
            )}

            {/* List View */}
            {activityView === 'list' && (
              <>
                {isActivityLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : activityError ? (
                  <Card className="p-6">
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Activity</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {activityError instanceof Error
                          ? activityError.message
                          : 'An error occurred while loading activity data. Please try again.'}
                      </p>
                      {(activityError as any)?.isPermissionError && (
                        <p className="text-xs text-gray-500 mb-4">
                          You may not have permission to view audit logs for this project.
                        </p>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.location.reload()}
                      >
                        Refresh Page
                      </Button>
                    </div>
                  </Card>
                ) : !activityData || !('content' in activityData) || activityData.content.length === 0 ? (
                  <Card className="p-6">
                    <EmptyState
                      icon={<Activity className="h-16 w-16 text-gray-400" />}
                      title="No Activity"
                      description="Activity for this project will appear here as actions are performed"
                    />
                  </Card>
                ) : (
                  <>
                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                      {activityData.content.map((log: AuditLog) => {
                        const getTimeAgo = (timestamp: string) => {
                          const date = new Date(timestamp);
                          const now = new Date();
                          const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

                          if (diffInSeconds < 60) return 'just now';
                          if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                          if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                          if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
                          return date.toLocaleDateString();
                        };

                        const formatAction = (action: string) => {
                          return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                        };

                        const getActionColor = (action: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
                          if (action.includes('CREATE')) return 'success';
                          if (action.includes('DELETE')) return 'danger';
                          if (action.includes('UPDATE') || action.includes('ROTATE')) return 'warning';
                          if (action.includes('READ')) return 'info';
                          return 'default';
                        };

                        return (
                          <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-lg ${getActionColor(log.action) === 'success' ? 'bg-green-100 text-green-600' :
                                getActionColor(log.action) === 'danger' ? 'bg-red-100 text-red-600' :
                                  getActionColor(log.action) === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                    getActionColor(log.action) === 'info' ? 'bg-blue-100 text-blue-600' :
                                      'bg-gray-100 text-gray-600'
                                }`}>
                                <Activity className="h-4 w-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={getActionColor(log.action)}>
                                    {formatAction(log.action)}
                                  </Badge>
                                  {log.resourceName && (
                                    <span className="text-sm font-medium text-gray-900">
                                      {log.resourceName}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                  by {log.userEmail || log.user?.email || 'Unknown'}
                                </p>
                              </div>

                              <div className="flex items-center text-sm text-gray-400">
                                <Clock className="h-4 w-4 mr-1" />
                                {getTimeAgo(log.createdAt || '')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {activityData.totalPages > 1 && (
                      <div className="flex justify-center">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                            disabled={activityPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="flex items-center px-4 text-sm text-gray-600">
                            Page {activityPage} of {activityData.totalPages}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActivityPage(p => Math.min(activityData.totalPages, p + 1))}
                            disabled={activityPage >= activityData.totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </ErrorBoundary>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Project Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metaPairs.map((item) => (
                <div key={item.label} className="rounded-2xl border border-neutral-100 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-neutral-900">{item.value}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-neutral-100 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Status</p>
                <p className="mt-2 text-lg font-semibold text-neutral-900">
                  {isArchived ? 'Archived' : 'Active'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">General Settings</h2>
              {canManageProject && (
                <Button
                  onClick={() => updateProjectMutation.mutate()}
                  disabled={!hasFormChanges || updateProjectMutation.isPending}
                >
                  {updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>

            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Project Name</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={!canManageProject}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                  rows={4}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe the scope, environments, or use cases for this project."
                  disabled={!canManageProject}
                />
              </div>
            </div>
          </div>

          {canManageProject ? (
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Project Lifecycle</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Archive projects you no longer need but may want to restore later. Permanently deleting removes all
                  secrets and activity forever.
                </p>
              </div>
              {transferableMembers.length > 0 && (
                <div className="flex flex-col gap-3 md:flex-row">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowTransferModal(true)}>
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
                      onClick={() => setShowArchiveModal(true)}
                      isLoading={archiveProjectMutation.isPending}
                    >
                      Archive Project
                    </Button>
                    <Button variant="danger" className="flex-1" onClick={() => setShowDeleteProjectModal(true)}>
                      Delete Project
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => setShowRestoreModal(true)}
                      isLoading={restoreProjectMutation.isPending}
                    >
                      Restore Project
                    </Button>
                    <Button variant="danger" className="flex-1" onClick={() => setShowDeleteProjectModal(true)}>
                      Delete Permanently
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-3xl p-6">
              <p className="text-sm font-semibold text-neutral-900 mb-2">Leave Project</p>
              <p className="text-sm text-neutral-500 mb-2">
                Remove your access to this project. You will need to be re-invited to regain access.
              </p>
              {isSoleOwner && (
                <p className="text-xs text-red-600 mb-4">
                  Promote another member to Owner before leaving. Projects require at least one active owner.
                </p>
              )}
              {canLeaveProject && (
                <Button
                  variant="secondary"
                  onClick={() => setShowLeaveModal(true)}
                  isLoading={leaveProjectMutation.isPending}
                >
                  Leave Project
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {/* Archive Modal */}
      <Modal isOpen={showArchiveModal} onClose={() => setShowArchiveModal(false)} title="Danger Zone">
        <div className="space-y-4">
          <p className="text-neutral-700">
            Archiving will hide <strong>{project?.name}</strong> from active lists. You can restore it at any time from
            the archived projects view.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowArchiveModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => archiveProjectMutation.mutate()} isLoading={archiveProjectMutation.isPending}>
              Archive Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Ownership Modal */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Transfer Ownership">
        <div className="space-y-4">
          <p className="text-neutral-700">
            Owners have full control over this project. Choose a member to promote before optionally demoting yourself.
          </p>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Select new owner</label>
            <select
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
            >
              <option value="">Choose member</option>
              {transferableMembers.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.user?.displayName || member.user?.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowTransferModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => transferOwnershipMutation.mutate()}
              disabled={!transferTarget}
              isLoading={transferOwnershipMutation.isPending}
            >
              Confirm Transfer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Project Modal */}
      <Modal isOpen={showDeleteProjectModal} onClose={() => setShowDeleteProjectModal(false)} title="Danger Zone">
        <div className="space-y-4">
          <p className="text-neutral-700">
            Deleting <strong>{project?.name}</strong> permanently removes all secrets, history, and membership. This
            action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowDeleteProjectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => deleteProjectMutation.mutate()} isLoading={deleteProjectMutation.isPending}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Restore Modal */}
      <Modal isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)} title="Restore Project">
        <div className="space-y-4">
          <p className="text-neutral-700">
            Restore <strong>{project?.name}</strong> to make it active again.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => restoreProjectMutation.mutate()} isLoading={restoreProjectMutation.isPending}>
              Restore Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave Modal */}
      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Danger Zone">
        <div className="space-y-4">
          <p className="text-neutral-700">
            Are you sure you want to leave <strong>{project?.name}</strong>? You will need a new invitation to regain
            access.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
              Stay
            </Button>
            <Button variant="danger" onClick={() => leaveProjectMutation.mutate()} isLoading={leaveProjectMutation.isPending}>
              Leave Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Secret Modal */}
      <Modal
        isOpen={!!showDeleteSecretModal}
        onClose={() => setShowDeleteSecretModal(null)}
        title="Delete Secret"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{showDeleteSecretModal}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowDeleteSecretModal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteSecretModal && deleteSecretMutation.mutate(showDeleteSecretModal)}
              isLoading={deleteSecretMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Member"
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
            >
              <option value="VIEWER">Viewer - Read-only access</option>
              <option value="MEMBER">Member - Can create and update secrets</option>
              <option value="ADMIN">Admin - Can manage secrets and members</option>
              {currentUserRole === 'OWNER' && (
                <option value="OWNER">Owner - Full control</option>
              )}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              isLoading={inviteMutation.isPending}
              disabled={!inviteEmail}
            >
              Send Invitation
            </Button>
          </div>

          {inviteMutation.isError && (
            <p className="text-sm text-red-600">
              Failed to send invitation. Please try again.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

