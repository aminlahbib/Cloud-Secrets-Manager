import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Key,
  Users,
  Settings as SettingsIcon,
  Activity,
  Upload,
} from 'lucide-react';
import { projectsService } from '../services/projects';
import { secretsService } from '../services/secrets';
import { membersService } from '../services/members';
import { auditService, type AuditLogsResponse } from '../services/audit';
import { workflowsService } from '../services/workflows';
import { useWorkflows } from '../hooks/useWorkflows';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import type { Project, Secret, ProjectMember, ProjectRole, TeamRole } from '../types';
import { FilterConfig } from '../components/ui/FilterPanel';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { SecretsTab } from '../components/projects/SecretsTab';
import { MembersTab } from '../components/shared/MembersTab';
import { InviteMemberModal } from '../components/projects/InviteMemberModal';
import { ActivityTab } from '../components/projects/ActivityTab';
import { SettingsTab } from '../components/projects/SettingsTab';
import {
  getLastNDays,
  prepareChartData,
} from '../utils/analytics';
import { useDebounce } from '../utils/debounce';
import { invalidateProjectQueries } from '../utils/queryInvalidation';


export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showNotification } = useNotifications();

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
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteSecretModal, setShowDeleteSecretModal] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
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
  const [selectedSecrets, setSelectedSecrets] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [secretFilters, setSecretFilters] = useState<Record<string, any>>({
    status: null,
    sortBy: null,
    sortDir: null,
  });

  // Fetch project details
  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getProject(projectId!),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes - project details rarely change
  });

  // Fetch workflows to find current workflow and allow selection
  const { data: workflows } = useWorkflows(user?.id);

  // Find current workflow for this project
  const currentWorkflow = useMemo(() => {
    if (!workflows || !projectId) return null;
    for (const workflow of workflows) {
      if (workflow.projects?.some(wp => wp.projectId === projectId)) {
        return workflow;
      }
    }
    return null;
  }, [workflows, projectId]);

  // Initialize selected workflow when current workflow is found
  useEffect(() => {
    if (currentWorkflow) {
      setSelectedWorkflowId(currentWorkflow.id);
    } else {
      setSelectedWorkflowId('');
    }
  }, [currentWorkflow]);

  // Fetch secrets
  const { data: secretsData, isLoading: isSecretsLoading } = useQuery({
    queryKey: ['project-secrets', projectId, debouncedSearchTerm, secretFilters],
    queryFn: () => secretsService.listProjectSecrets(projectId!, {
      keyword: debouncedSearchTerm || undefined,
      sortBy: secretFilters.sortBy || 'createdAt',
      sortDir: secretFilters.sortDir || 'DESC',
    }),
    enabled: !!projectId && activeTab === 'secrets',
    staleTime: 60 * 1000, // 1 minute - secrets change more frequently
  });

  // Fetch members
  const { data: members, isLoading: isMembersLoading } = useQuery<ProjectMember[]>({
    queryKey: ['project-members', projectId],
    queryFn: () => membersService.listMembers(projectId!),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes - members rarely change
  });

  // Calculate permissions early (before queries that depend on them)
  const ownerCount = members?.filter((member) => member.role === 'OWNER').length ?? 0;
  const currentUserRole = project?.currentUserRole;
  const canManageSecrets = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN' || currentUserRole === 'MEMBER';
  const canDeleteSecrets = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canManageMembers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canManageProject = currentUserRole === 'OWNER';
  const isSoleOwner = currentUserRole === 'OWNER' && ownerCount <= 1;
  const canLeaveProject =
    !currentUserRole ? false : currentUserRole !== 'OWNER' ? true : ownerCount > 1;

  // Fetch pending invitations
  const { data: pendingInvitations } = useQuery({
    queryKey: ['project-invitations', projectId],
    queryFn: () => membersService.listPendingInvitations(projectId!),
    enabled: !!projectId && canManageMembers,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Calculate date range for analytics (memoized)
  const dateRangeParams = useMemo(() => {
    if (dateRange === 'all') return {};
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, [dateRange]);

  // Track if tab is visible to disable polling when hidden
  const [isTabVisible, setIsTabVisible] = useState(true);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Fetch project activity logs for list view (paginated)
  const shouldPollActivity = activeTab === 'activity' && activityView === 'list' && isTabVisible;
  const { data: activityData, isLoading: isActivityLoading, error: activityError } = useQuery<AuditLogsResponse>({
    queryKey: ['project-activity', projectId, activityPage],
    queryFn: () => auditService.getProjectAuditLogs(projectId!, { page: activityPage - 1, size: 20 }),
    enabled: !!projectId && activeTab === 'activity' && activityView === 'list',
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - preserve audit data across sessions
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes even when not in use
    refetchInterval: shouldPollActivity ? 30000 : false, // Only poll when tab is active and visible
  });

  // Fetch analytics using server-side aggregation
  const shouldPollAnalytics = activeTab === 'activity' && activityView === 'analytics' && isTabVisible;
  const { data: analyticsData, isLoading: isAnalyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['project-activity-analytics', projectId, dateRange],
    queryFn: () => {
      if (!dateRangeParams.startDate || !dateRangeParams.endDate) {
        throw new Error('Date range is required for analytics');
      }
      return auditService.getProjectAnalytics(projectId!, dateRangeParams.startDate, dateRangeParams.endDate);
    },
    enabled: !!projectId && activeTab === 'activity' && activityView === 'analytics' && !!dateRangeParams.startDate,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - preserve audit data across sessions
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes even when not in use
    refetchInterval: shouldPollAnalytics ? 60000 : false, // Poll every 60 seconds when active and visible
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

  // Export analytics data
  const exportAnalytics = useCallback(() => {
    if (!analyticsStats || !project) return;

    const exportData = {
      project: {
        id: project.id,
        name: project.name,
      },
      dateRange,
      generatedAt: new Date().toISOString(),
      stats: {
        totalActions: analyticsStats.totalActions,
        activeUsers: Object.keys(analyticsStats.actionsByUser).length,
        actionTypes: Object.keys(analyticsStats.actionsByType).length,
      },
      actionsByType: analyticsStats.actionsByType,
      actionsByDay: analyticsStats.actionsByDay,
      topUsers: analyticsStats.topUsers,
      topActions: analyticsStats.topActions,
      chartData,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${project.name.replace(/\s+/g, '-')}-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analyticsStats, project, dateRange, chartData]);

  // Bulk delete secrets mutation
  const bulkDeleteSecretsMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      await Promise.all(keys.map((key) => secretsService.deleteProjectSecret(projectId!, key)));
    },
    onSuccess: () => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
      setSelectedSecrets(new Set());
      setShowBulkDeleteModal(false);
    },
  });

  // Import secrets mutation
  const importSecretsMutation = useMutation({
    mutationFn: async (secretsToImport: Array<{ key: string; value: string; description?: string; expiresAt?: Date }>) => {
      const results = await Promise.allSettled(
        secretsToImport.map((secret) =>
          secretsService.createProjectSecret(projectId!, {
            secretKey: secret.key,
            value: secret.value,
            description: secret.description,
            expiresAt: secret.expiresAt ? secret.expiresAt.toISOString().split('.')[0] + 'Z' : undefined,
          })
        )
      );
      return results;
    },
    onSuccess: (results) => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
      setShowImportModal(false);
      setImportFile(null);
      setImportError(null);
      const successCount = results.filter((r: PromiseSettledResult<any>) => r.status === 'fulfilled').length;
      const errorCount = results.filter((r: PromiseSettledResult<any>) => r.status === 'rejected').length;
      if (errorCount > 0) {
        showNotification({
          type: 'warning',
          title: 'Import completed with errors',
          message: `Imported ${successCount} secrets. ${errorCount} failed.`,
        });
      } else {
        showNotification({
          type: 'success',
          title: 'Secrets imported',
          message: `Successfully imported ${successCount} secret${successCount !== 1 ? 's' : ''}`,
        });
      }
    },
    onError: (error) => {
      showNotification({
        type: 'error',
        title: 'Import failed',
        message: error instanceof Error ? error.message : 'Failed to import secrets',
      });
    },
  });

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
      invalidateProjectQueries(queryClient, projectId!, user?.id);
      setShowDeleteSecretModal(null);
      showNotification({
        type: 'success',
        title: 'Secret deleted',
        message: 'The secret has been successfully deleted',
      });
    },
  });


  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => membersService.removeMember(projectId!, userId),
    onSuccess: () => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
      membersService.updateMemberRole(projectId!, userId, { role }),
    onSuccess: () => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
    },
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: () => membersService.transferOwnership(projectId!, { newOwnerUserId: transferTarget }),
    onSuccess: () => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
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

  // Mutation to move project between workflows
  const moveProjectToWorkflowMutation = useMutation({
    mutationFn: async ({ fromWorkflowId, toWorkflowId }: { fromWorkflowId: string | null; toWorkflowId: string | null }) => {
      if (fromWorkflowId && toWorkflowId && fromWorkflowId !== toWorkflowId) {
        // Move from one workflow to another
        await workflowsService.moveProjectToWorkflow(projectId!, fromWorkflowId, toWorkflowId);
      } else if (fromWorkflowId && !toWorkflowId) {
        // Remove from workflow
        await workflowsService.removeProjectFromWorkflow(fromWorkflowId, projectId!);
      } else if (!fromWorkflowId && toWorkflowId) {
        // Add to workflow
        await workflowsService.addProjectToWorkflow(toWorkflowId, projectId!);
      }
    },
    onSuccess: () => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
    },
  });

  useEffect(() => {
    if (!showTransferModal) {
      setTransferTarget('');
    }
  }, [showTransferModal]);

  const secretFilterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'active' },
        { label: 'Expired', value: 'expired' },
        { label: 'Expiring Soon', value: 'expiring' },
      ],
    },
    {
      key: 'sortBy',
      label: 'Sort By',
      type: 'select',
      options: [
        { label: 'Default', value: '' },
        { label: 'Created Date', value: 'createdAt' },
        { label: 'Updated Date', value: 'updatedAt' },
        { label: 'Key', value: 'secretKey' },
      ],
    },
    {
      key: 'sortDir',
      label: 'Order',
      type: 'select',
      options: [
        { label: 'Default', value: '' },
        { label: 'Newest First', value: 'DESC' },
        { label: 'Oldest First', value: 'ASC' },
      ],
    },
  ], []);

  const secrets = useMemo(() => {
    let filtered = secretsData?.content ?? [];
    
    // Apply status filter (client-side filtering for status)
    if (secretFilters.status) {
      const now = new Date();
      filtered = filtered.filter((secret: Secret) => {
        if (secretFilters.status === 'expired') {
          return secret.expired || (secret.expiresAt && new Date(secret.expiresAt) < now);
        }
        if (secretFilters.status === 'expiring') {
          if (!secret.expiresAt) return false;
          const expiresAt = new Date(secret.expiresAt);
          const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return !secret.expired && expiresAt > now && daysUntilExpiry <= 30;
        }
        if (secretFilters.status === 'active') {
          return !secret.expired && (!secret.expiresAt || new Date(secret.expiresAt) > now);
        }
        return true;
      });
    }
    
    return filtered;
  }, [secretsData?.content, secretFilters.status]);

  // Bulk selection handlers
  const toggleSecretSelection = useCallback((secretKey: string) => {
    setSelectedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(secretKey)) {
        next.delete(secretKey);
      } else {
        next.add(secretKey);
      }
      return next;
    });
  }, []);

  const selectAllSecrets = useCallback(() => {
    if (selectedSecrets.size === secrets.length) {
      setSelectedSecrets(new Set());
    } else {
      setSelectedSecrets(new Set(secrets.map((s: Secret) => s.secretKey)));
    }
  }, [secrets, selectedSecrets.size]);

  const clearSelection = useCallback(() => {
    setSelectedSecrets(new Set());
  }, []);
  const transferableMembers = useMemo(
    () => (members || []).filter((member) => member.userId !== user?.id),
    [members, user?.id]
  );
  const handleMemberRoleChange = useCallback((memberId: string, newRole: ProjectRole | TeamRole) => {
    const member = members?.find((m) => m.userId === memberId);
    if (!member || member.role === newRole) return;
    setRoleChangeTarget(memberId);
    updateMemberRoleMutation.mutate(
      { userId: memberId, role: newRole as ProjectRole },
      {
        onSettled: () => setRoleChangeTarget(null),
      }
    );
  }, [updateMemberRoleMutation, members]);
  const availableRoleOptions: ProjectRole[] =
    currentUserRole === 'OWNER' ? ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] : ['ADMIN', 'MEMBER', 'VIEWER'];

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
      invalidateProjectQueries(queryClient, projectId!, user?.id);
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: () => projectsService.archiveProject(projectId!),
    onSuccess: () => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
      setShowArchiveModal(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsService.deleteProjectPermanently(projectId!),
    onSuccess: () => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
      setShowDeleteProjectModal(false);
      showNotification({
        type: 'success',
        title: 'Project deleted',
        message: 'The project has been permanently deleted',
      });
      navigate('/projects');
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Failed to delete project',
        message: error?.response?.data?.message || error?.message || 'An error occurred while deleting the project',
      });
    },
  });

  const restoreProjectMutation = useMutation({
    mutationFn: () => projectsService.restoreProject(projectId!),
    onSuccess: () => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
      setShowRestoreModal(false);
    },
  });

  const leaveProjectMutation = useMutation({
    mutationFn: () => projectsService.leaveProject(projectId!),
    onSuccess: () => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
      setShowLeaveModal(false);
      navigate('/projects');
    },
  });

  // All hooks must be called before any early returns
  const handleExportSecrets = useCallback(() => {
    if (!project) return;
    const exportData = {
      project: {
        id: project.id,
        name: project.name,
      },
      exportedAt: new Date().toISOString(),
      secrets: secrets.map((s: Secret) => ({
        key: s.secretKey,
        description: s.description || '',
        expiresAt: s.expiresAt || null,
      })),
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secrets-${project.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [project, secrets]);

  const handleImportSecrets = useCallback(() => setShowImportModal(true), []);
  const handleAddSecret = useCallback(() => navigate(`/projects/${projectId}/secrets/new`), [navigate, projectId]);
  const handleInviteMember = useCallback(() => setShowInviteModal(true), []);
  const handleFilterChange = useCallback((key: string, value: any) => setSecretFilters(prev => ({ ...prev, [key]: value })), []);
  const handleFilterClear = useCallback(() => setSecretFilters({ status: null, sortBy: null, sortDir: null }), []);
  const handleDeleteSecret = useCallback((key: string) => setShowDeleteSecretModal(key), []);
  const handleBulkDelete = useCallback(() => setShowBulkDeleteModal(true), []);
  const handleRemoveMember = useCallback((userId: string) => removeMemberMutation.mutate(userId), [removeMemberMutation]);
  
  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => membersService.revokeInvitation(projectId!, invitationId),
    onSuccess: () => {
      invalidateProjectQueries(queryClient, projectId!, user?.id);
      queryClient.invalidateQueries({ queryKey: ['project-invitations', projectId] });
    },
  });

  const handleCancelInvitation = useCallback(
    (invitationId: string) => revokeInvitationMutation.mutate(invitationId),
    [revokeInvitationMutation]
  );
  const handleWorkflowChange = useCallback((workflowId: string | null) => {
    const oldWorkflowId = currentWorkflow?.id || null;
    setSelectedWorkflowId(workflowId || '');
    moveProjectToWorkflowMutation.mutate({
      fromWorkflowId: oldWorkflowId,
      toWorkflowId: workflowId,
    });
  }, [currentWorkflow, moveProjectToWorkflowMutation]);
  const handleTransferOwnership = useCallback(() => setShowTransferModal(true), []);
  const handleArchive = useCallback(() => setShowArchiveModal(true), []);
  const handleRestore = useCallback(() => setShowRestoreModal(true), []);
  const handleDeleteProject = useCallback(() => setShowDeleteProjectModal(true), []);
  const handleLeave = useCallback(() => setShowLeaveModal(true), []);
  const handleSave = useCallback(() => updateProjectMutation.mutate(), [updateProjectMutation]);

  // Early returns after all hooks
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
        <div 
          className="border rounded-lg p-6 transition-colors"
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            borderColor: 'var(--status-danger)',
          }}
        >
          <h2 className="text-h3 font-semibold mb-2" style={{ color: 'var(--status-danger)' }}>Project Not Found</h2>
          <p className="text-body-sm mb-4" style={{ color: 'var(--status-danger)' }}>
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
      <ProjectHeader
        project={project}
        activeTab={activeTab}
        canManageSecrets={canManageSecrets}
        canManageMembers={canManageMembers}
        onExportSecrets={handleExportSecrets}
        onImportSecrets={handleImportSecrets}
        onAddSecret={handleAddSecret}
        onInviteMember={handleInviteMember}
        onTabChange={setActiveTab}
        secretsCount={secrets.length}
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
      {activeTab === 'secrets' && (
        <SecretsTab
                    projectId={projectId!}
          secrets={secrets}
          isLoading={isSecretsLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          secretFilters={secretFilters}
          onFilterChange={handleFilterChange}
          onFilterClear={handleFilterClear}
          secretFilterConfigs={secretFilterConfigs}
          selectedSecrets={selectedSecrets}
          onToggleSelection={toggleSecretSelection}
          onSelectAll={selectAllSecrets}
          onClearSelection={clearSelection}
                    canManageSecrets={canManageSecrets}
                    canDeleteSecrets={canDeleteSecrets}
          onDeleteSecret={handleDeleteSecret}
          onBulkDelete={handleBulkDelete}
          isBulkDeleting={bulkDeleteSecretsMutation.isPending}
        />
      )}

      {activeTab === 'members' && (
        <MembersTab
          members={members}
          type="project"
          isLoading={isMembersLoading}
          currentUserId={user?.id}
          currentUserRole={currentUserRole || 'VIEWER'}
          canManageMembers={canManageMembers}
          availableRoles={availableRoleOptions}
          roleChangeTarget={roleChangeTarget}
          isUpdatingRole={updateMemberRoleMutation.isPending}
          pendingInvitations={pendingInvitations}
          onRoleChange={handleMemberRoleChange}
          onRemoveMember={handleRemoveMember}
          onInviteMember={handleInviteMember}
          onCancelInvitation={handleCancelInvitation}
        />
      )}

      {activeTab === 'activity' && (
        <ActivityTab
          projectId={projectId}
          activityView={activityView}
          onViewChange={setActivityView}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          analyticsStats={analyticsStats}
          isAnalyticsLoading={isAnalyticsLoading}
          analyticsError={analyticsError}
          chartData={chartData}
          onExportAnalytics={exportAnalytics}
          activityData={activityData}
          isActivityLoading={isActivityLoading}
          activityError={activityError}
          activityPage={activityPage}
          onPageChange={setActivityPage}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          project={project}
          metaPairs={metaPairs}
          isArchived={isArchived}
          canManageProject={canManageProject}
          canLeaveProject={canLeaveProject ?? false}
          isSoleOwner={isSoleOwner}
          projectName={projectName}
          projectDescription={projectDescription}
          onProjectNameChange={setProjectName}
          onProjectDescriptionChange={setProjectDescription}
          hasFormChanges={hasFormChanges ?? false}
          isSaving={updateProjectMutation.isPending}
          onSave={handleSave}
          workflows={workflows}
          selectedWorkflowId={selectedWorkflowId}
          onWorkflowChange={handleWorkflowChange}
          isMovingWorkflow={moveProjectToWorkflowMutation.isPending}
          transferableMembers={transferableMembers}
          onTransferOwnership={handleTransferOwnership}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onDelete={handleDeleteProject}
          onLeave={handleLeave}
          isArchiving={archiveProjectMutation.isPending}
          isRestoring={restoreProjectMutation.isPending}
          isLeaving={leaveProjectMutation.isPending}
          members={members}
          currentUserRole={currentUserRole}
          canManageMembers={canManageMembers}
          pendingInvitations={pendingInvitations}
          onInviteMember={handleInviteMember}
          onCancelInvitation={handleCancelInvitation}
          onRoleChange={handleMemberRoleChange}
          onRemoveMember={handleRemoveMember}
          availableRoles={availableRoleOptions}
          roleChangeTarget={roleChangeTarget}
          isUpdatingRole={updateMemberRoleMutation.isPending}
        />
      )}
      {/* Archive Modal */}
      <Modal isOpen={showArchiveModal} onClose={() => setShowArchiveModal(false)} title="Danger Zone">
        <div className="space-y-4">
          <p style={{ color: 'var(--text-primary)' }}>
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
          <p style={{ color: 'var(--text-primary)' }}>
            Owners have full control over this project. Choose a member to promote before optionally demoting yourself.
          </p>
          <div>
            <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Select new owner</label>
            <select
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="input-theme w-full px-4 py-2 rounded-lg focus:ring-2"
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

      {/* Bulk Delete Secrets Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Delete Selected Secrets"
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--text-primary)' }}>
            Are you sure you want to delete <strong>{selectedSecrets.size}</strong> secret{selectedSecrets.size !== 1 ? 's' : ''}? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowBulkDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => bulkDeleteSecretsMutation.mutate(Array.from(selectedSecrets))}
              isLoading={bulkDeleteSecretsMutation.isPending}
            >
              Delete {selectedSecrets.size} Secret{selectedSecrets.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Project Modal */}
      <Modal isOpen={showDeleteProjectModal} onClose={() => setShowDeleteProjectModal(false)} title="Danger Zone">
        <div className="space-y-4">
          <p style={{ color: 'var(--text-primary)' }}>
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
          <p style={{ color: 'var(--text-primary)' }}>
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
          <p style={{ color: 'var(--text-primary)' }}>
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
          <p style={{ color: 'var(--text-primary)' }}>
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
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
        }}
        projectId={projectId!}
        projectName={project?.name || ''}
        currentUserRole={currentUserRole || 'VIEWER'}
        onSuccess={() => {
          invalidateProjectQueries(queryClient, projectId!, user?.id);
        }}
      />

      {/* Import Secrets Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportError(null);
        }}
        title="Import Secrets"
      >
        <div className="space-y-4">
          <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            Upload a JSON file to import secrets. The file should contain an array of secrets with <code className="px-1 rounded" style={{ backgroundColor: 'var(--elevation-2)' }}>key</code> and <code className="px-1 rounded" style={{ backgroundColor: 'var(--elevation-2)' }}>value</code> fields.
          </p>

          <div>
            <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Select File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImportFile(file);
                  setImportError(null);
                }
              }}
              className="input-theme w-full px-4 py-2 rounded-lg focus:ring-2"
            />
            {importFile && (
              <p className="mt-2 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                Selected: {importFile.name}
              </p>
            )}
          </div>

          {importError && (
            <div 
              className="border rounded-lg p-3"
              style={{
                backgroundColor: 'var(--status-danger-bg)',
                borderColor: 'var(--status-danger)',
              }}
            >
              <p className="text-body-sm" style={{ color: 'var(--status-danger)' }}>{importError}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
                setImportError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!importFile) {
                  setImportError('Please select a file');
                  return;
                }

                try {
                  const text = await importFile.text();
                  const data = JSON.parse(text);
                  
                  // Support both array format and object with secrets array
                  const secretsToImport = Array.isArray(data) ? data : (data.secrets || []);
                  
                  if (!Array.isArray(secretsToImport) || secretsToImport.length === 0) {
                    setImportError('Invalid file format. Expected an array of secrets.');
                    return;
                  }

                  // Validate secrets
                  const validSecrets = secretsToImport
                    .filter((s) => s.key && s.value)
                    .map((s) => ({
                      key: s.key,
                      value: s.value,
                      description: s.description || '',
                      expiresAt: s.expiresAt ? new Date(s.expiresAt) : undefined,
                    }));

                  if (validSecrets.length === 0) {
                    setImportError('No valid secrets found. Each secret must have a key and value.');
                    return;
                  }

                  // Import secrets
                  importSecretsMutation.mutate(validSecrets);
                } catch (error) {
                  setImportError(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
              disabled={!importFile || importSecretsMutation.isPending}
              isLoading={importSecretsMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Secrets
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

