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
  LayoutGrid,
  Download,
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
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import type { Project, Secret, ProjectMember, ProjectRole, AuditLog } from '../types';
import { StatsCards } from '../components/analytics/StatsCards';
import { ActivityChart } from '../components/analytics/ActivityChart';
import { ActionDistributionChart } from '../components/analytics/ActionDistributionChart';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Skeleton, SkeletonTable, SkeletonStats } from '../components/ui/Skeleton';
import { SecretCard } from '../components/ui/SecretCard';
import { FilterPanel, FilterConfig } from '../components/ui/FilterPanel';
import {
  getLastNDays,
  prepareChartData,
  formatActionName,
} from '../utils/analytics';
import { useDebounce } from '../utils/debounce';

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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('MEMBER');
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
    sortBy: 'createdAt',
    sortDir: 'DESC',
  });

  // Fetch project details
  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getProject(projectId!),
    enabled: !!projectId,
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
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowDeleteSecretModal(null);
      showNotification({
        type: 'success',
        title: 'Secret deleted',
        message: 'The secret has been successfully deleted',
      });
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
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
      }
    },
  });

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

  const secretFilterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
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
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
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
                <h1 className="text-h1 font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
                {currentUserRole && (
                  <Badge variant={ROLE_COLORS[currentUserRole]}>
                    {ROLE_ICONS[currentUserRole]}
                    {currentUserRole}
                  </Badge>
                )}
                {project.isArchived && <Badge variant="warning">Archived</Badge>}
              </div>
              {project.description && <p className="mt-1 text-body-sm" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>}
            </div>

            <div className="flex gap-2">
              {activeTab === 'secrets' && canManageSecrets && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // Export secrets to JSON
                      const exportData = {
                        project: {
                          id: project?.id,
                          name: project?.name,
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
                      a.download = `secrets-${project?.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    disabled={secrets.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowImportModal(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={() => navigate(`/projects/${projectId}/secrets/new`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Secret
                  </Button>
                </>
              )}

              {activeTab === 'members' && canManageMembers && (
                <Button onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>
          </div>
          <div 
            className="rounded-3xl border px-6 py-4 text-body-sm transition-colors"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--elevation-1)',
              color: 'var(--text-secondary)',
            }}
          >
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
        <div className="tab-content-container space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search secrets..."
                className="input-theme pl-10 pr-4 py-2"
              />
            </div>
            <FilterPanel
              filters={secretFilterConfigs}
              values={secretFilters}
              onChange={(key, value) => setSecretFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setSecretFilters({ status: null, sortBy: 'createdAt', sortDir: 'DESC' })}
            />
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedSecrets.size > 0 && canDeleteSecrets && (
            <div 
              className="border rounded-lg p-4 flex items-center justify-between"
              style={{
                backgroundColor: 'var(--status-info-bg)',
                borderColor: 'var(--status-info)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-body-sm font-medium" style={{ color: 'var(--status-info)' }}>
                  {selectedSecrets.size} secret{selectedSecrets.size !== 1 ? 's' : ''} selected
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection} style={{ color: 'var(--status-info)' }}>
                  Clear
                </Button>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={bulkDeleteSecretsMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}

          {isSecretsLoading ? (
            <SkeletonTable rows={5} cols={6} />
          ) : secrets.length === 0 ? (
            <EmptyState
              icon={<Key className="h-16 w-16" style={{ color: 'var(--text-tertiary)' }} />}
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
              <div className="hidden md:block rounded-lg border overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <table className="min-w-full table-theme" style={{ borderColor: 'var(--table-divider)' }}>
                  <thead className="table-header-theme">
                    <tr>
                      {canDeleteSecrets && (
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedSecrets.size === secrets.length && secrets.length > 0}
                            onChange={selectAllSecrets}
                            className="h-4 w-4 rounded transition-colors"
                            style={{
                              borderColor: 'var(--border-default)',
                              color: 'var(--accent-primary)',
                            }}
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300" style={{ color: 'var(--tab-text-muted)', backgroundColor: 'var(--table-header-bg)' }}>Key</th>
                      <th className="px-6 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        Last Change
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-caption font-medium uppercase tracking-wider transition-colors duration-300" style={{ color: 'var(--tab-text-muted)', backgroundColor: 'var(--table-header-bg)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-theme table-divider-theme" style={{ borderColor: 'var(--table-divider)' }}>
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
                        <tr 
                          key={secret.id || secret.secretKey} 
                          className="transition-colors"
                          style={{
                            backgroundColor: 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {canDeleteSecrets && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedSecrets.has(secret.secretKey)}
                                onChange={() => toggleSecretSelection(secret.secretKey)}
                                className="h-4 w-4 rounded transition-colors"
                                style={{
                                  borderColor: 'var(--border-default)',
                                  color: 'var(--accent-primary)',
                                }}
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`}
                              className="text-body-sm font-medium hover:underline transition-colors"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {secret.secretKey}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(secret.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-body-sm" style={{ color: 'var(--text-primary)' }}>{new Date(lastChangeDate).toLocaleDateString()}</div>
                            {lastChangeUser && <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>by {lastChangeUser}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>v{versionNumber}</div>
                            <Link 
                              to={historyLink} 
                              className="text-caption transition-colors"
                              style={{ color: 'var(--text-tertiary)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--text-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-tertiary)';
                              }}
                            >
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
                                <Trash2 className="h-4 w-4" style={{ color: 'var(--status-danger)' }} />
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
                  <div key={secret.id || secret.secretKey} className="relative">
                    {canDeleteSecrets && (
                      <div className="absolute top-4 left-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedSecrets.has(secret.secretKey)}
                          onChange={() => toggleSecretSelection(secret.secretKey)}
                          className="h-5 w-5 rounded transition-colors"
                          style={{
                            borderColor: 'var(--border-default)',
                            color: 'var(--accent-primary)',
                          }}
                        />
                      </div>
                    )}
                    <SecretCard
                      secret={secret}
                      projectId={projectId!}
                      canManageSecrets={canManageSecrets}
                      canDeleteSecrets={canDeleteSecrets}
                      onView={() => navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`)}
                      onEdit={() => navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}/edit`)}
                      onDelete={() => setShowDeleteSecretModal(secret.secretKey)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="tab-content-container space-y-4">
          {isMembersLoading && activeTab === 'members' ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : !members || members.length === 0 ? (
            <EmptyState
              icon={<Users className="h-16 w-16" style={{ color: 'var(--text-tertiary)' }} />}
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
            <div className="rounded-lg border divide-y transition-colors duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <style>{`
                .table-divider-theme > * {
                  border-color: var(--table-divider);
                }
              `}</style>
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 flex items-center justify-between transition-colors duration-300"
                  style={{
                    '--hover-bg': 'var(--tab-hover-bg)',
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--tab-hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--tab-hover-bg)' }}>
                      <span className="font-medium transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                        {(member.user?.displayName || member.user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                        {member.user?.displayName || member.user?.email}
                        {member.userId === user?.id && (
                          <span className="ml-2 text-xs transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>(You)</span>
                        )}
                      </p>
                      <p className="text-sm flex items-center transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
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
                        className="input-theme px-3 py-1.5 rounded-lg text-body-sm focus:outline-none focus:ring-2"
                        style={{
                          borderColor: 'var(--input-border)',
                          color: 'var(--input-text)',
                        }}
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
                        <Trash2 className="h-4 w-4" style={{ color: 'var(--status-danger)' }} />
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
                <p className="mb-2" style={{ color: 'var(--status-danger)' }}>Error loading activity tab</p>
                <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                  There was an error displaying the activity tab. Please try refreshing the page.
                </p>
                <Button onClick={() => window.location.reload()}>Refresh Page</Button>
              </div>
            </Card>
          }
        >
          <div className="tab-content-container space-y-6">
            {/* Header with view toggle and date filter */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-h3 font-semibold" style={{ color: 'var(--text-primary)' }}>Project Activity</h2>
              <div className="flex items-center gap-3">
                {/* Date Range Filter and Export (only for analytics) */}
                {activityView === 'analytics' && (
                  <>
                    <div 
                      className="flex items-center gap-2 rounded-lg p-1"
                      style={{ backgroundColor: 'var(--elevation-1)' }}
                    >
                      <Calendar className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
                        className="bg-transparent border-none text-body-sm font-medium focus:outline-none cursor-pointer transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="all">All time</option>
                      </select>
                    </div>
                    {analyticsStats && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={exportAnalytics}
                        className="!m-0"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    )}
                  </>
                )}

                {/* View Toggle */}
                <div 
                  className="flex items-center gap-2 rounded-lg p-1"
                  style={{ backgroundColor: 'var(--elevation-1)' }}
                >
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
                      <div className="card rounded-lg p-6">
                        <Skeleton variant="text" width="40%" height={24} className="mb-4" />
                        <Skeleton variant="rectangular" width="100%" height={300} />
                      </div>
                      <div className="card rounded-lg p-6">
                        <Skeleton variant="text" width="40%" height={24} className="mb-4" />
                        <Skeleton variant="rectangular" width="100%" height={300} />
                      </div>
                    </div>
                  </div>
                ) : analyticsError ? (
                  <Card className="p-6">
                    <div className="text-center">
                      <div 
                        className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4"
                        style={{ backgroundColor: 'var(--status-danger-bg)' }}
                      >
                        <AlertTriangle className="h-6 w-6" style={{ color: 'var(--status-danger)' }} />
                      </div>
                      <h3 className="text-h3 font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Error Loading Analytics</h3>
                      <p className="text-body-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                        {analyticsError instanceof Error
                          ? analyticsError.message
                          : 'An error occurred while loading analytics. Please try again.'}
                      </p>
                      {(analyticsError as any)?.isPermissionError && (
                        <p className="text-caption mb-4" style={{ color: 'var(--text-tertiary)' }}>
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
                      icon={<Activity className="h-16 w-16" style={{ color: 'var(--text-tertiary)' }} />}
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
                            icon={<Activity className="h-16 w-16" style={{ color: 'var(--text-tertiary)' }} />}
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
                            <h3 className="text-h3 font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Contributors</h3>
                            {analyticsStats.topUsers.length === 0 ? (
                              <p className="text-body-sm" style={{ color: 'var(--text-tertiary)' }}>No user data available</p>
                            ) : (
                              <div className="space-y-3">
                                {analyticsStats.topUsers.map((user: { userId: string; email?: string; count: number }, index: number) => (
                                  <div key={user.userId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-semibold"
                                        style={{
                                          backgroundColor: 'var(--elevation-2)',
                                          color: 'var(--text-secondary)',
                                        }}
                                      >
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                          {user.email || 'Unknown User'}
                                        </p>
                                        <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{user.count} actions</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>

                          {/* Top Actions */}
                          <Card className="p-6">
                            <h3 className="text-h3 font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Most Common Actions</h3>
                            {analyticsStats.topActions.length === 0 ? (
                              <p className="text-body-sm" style={{ color: 'var(--text-tertiary)' }}>No action data available</p>
                            ) : (
                              <div className="space-y-3">
                                {analyticsStats.topActions.map((action: { action: string; count: number }, index: number) => (
                                  <div key={action.action} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-semibold"
                                        style={{
                                          backgroundColor: 'var(--status-info-bg)',
                                          color: 'var(--status-info)',
                                        }}
                                      >
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                          {formatActionName(action.action)}
                                        </p>
                                        <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{action.count} occurrences</p>
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
                          <p className="mb-2" style={{ color: 'var(--status-danger)' }}>Error rendering analytics</p>
                          <p className="text-body-sm" style={{ color: 'var(--text-tertiary)' }}>{String(error)}</p>
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
                      <div 
                        className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4"
                        style={{ backgroundColor: 'var(--status-danger-bg)' }}
                      >
                        <AlertTriangle className="h-6 w-6" style={{ color: 'var(--status-danger)' }} />
                      </div>
                      <h3 className="text-h3 font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Error Loading Activity</h3>
                      <p className="text-body-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                        {activityError instanceof Error
                          ? activityError.message
                          : 'An error occurred while loading activity data. Please try again.'}
                      </p>
                      {(activityError as any)?.isPermissionError && (
                        <p className="text-caption mb-4" style={{ color: 'var(--text-tertiary)' }}>
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
                      icon={<Activity className="h-16 w-16" style={{ color: 'var(--text-tertiary)' }} />}
                      title="No Activity"
                      description="Activity for this project will appear here as actions are performed"
                    />
                  </Card>
                ) : (
                  <>
                    <div 
                      className="rounded-lg border divide-y transition-colors duration-300"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                      }}
                    >
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
                          <div 
                            key={log.id} 
                            className="p-4 transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div className="flex items-start gap-4">
                              <div 
                                className="p-2 rounded-lg"
                                style={{
                                  backgroundColor: getActionColor(log.action) === 'success' ? 'var(--status-success-bg)' :
                                    getActionColor(log.action) === 'danger' ? 'var(--status-danger-bg)' :
                                      getActionColor(log.action) === 'warning' ? 'var(--status-warning-bg)' :
                                        getActionColor(log.action) === 'info' ? 'var(--status-info-bg)' :
                                          'var(--elevation-2)',
                                  color: getActionColor(log.action) === 'success' ? 'var(--status-success)' :
                                    getActionColor(log.action) === 'danger' ? 'var(--status-danger)' :
                                      getActionColor(log.action) === 'warning' ? 'var(--status-warning)' :
                                        getActionColor(log.action) === 'info' ? 'var(--status-info)' :
                                          'var(--text-secondary)',
                                }}
                              >
                                <Activity className="h-4 w-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={getActionColor(log.action)}>
                                    {formatAction(log.action)}
                                  </Badge>
                                  {log.resourceName && (
                                    <span className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                      {log.resourceName}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-body-sm" style={{ color: 'var(--text-tertiary)' }}>
                                  by {log.userEmail || log.user?.email || 'Unknown'}
                                </p>
                              </div>

                              <div className="flex items-center text-body-sm" style={{ color: 'var(--text-tertiary)' }}>
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
                          <span className="flex items-center px-4 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
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
        <div className="tab-content-container space-y-6">
          <div className="card rounded-3xl">
            <h2 className="text-xl font-semibold mb-6 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>Project Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metaPairs.map((item) => (
                <div key={item.label} className="rounded-2xl border p-4 transition-colors duration-300" style={{ backgroundColor: 'var(--tab-bg)', borderColor: 'var(--tab-border)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>{item.label}</p>
                  <p className="mt-2 text-lg font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>{item.value}</p>
                </div>
              ))}
              <div className="rounded-2xl border p-4 transition-colors duration-300" style={{ backgroundColor: 'var(--tab-bg)', borderColor: 'var(--tab-border)' }}>
                <p className="text-xs uppercase tracking-[0.2em] transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>Status</p>
                <p className="mt-2 text-lg font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                  {isArchived ? 'Archived' : 'Active'}
                </p>
              </div>
            </div>
          </div>

          <div className="card rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>General Settings</h2>
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
                <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Project Name</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={!canManageProject}
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  className="input-theme w-full px-4 py-3 rounded-xl focus:ring-2"
                  rows={4}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe the scope, environments, or use cases for this project."
                  disabled={!canManageProject}
                />
              </div>

              {/* Workflow Selection */}
              <div>
                <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Workflow
                  <span className="font-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none">
                    <LayoutGrid className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <select
                    value={selectedWorkflowId}
                    onChange={(e) => {
                      const newWorkflowId = e.target.value || null;
                      const oldWorkflowId = currentWorkflow?.id || null;
                      setSelectedWorkflowId(newWorkflowId || '');
                      moveProjectToWorkflowMutation.mutate({
                        fromWorkflowId: oldWorkflowId,
                        toWorkflowId: newWorkflowId,
                      });
                    }}
                    disabled={!canManageProject || moveProjectToWorkflowMutation.isPending}
                    className="input-theme w-full pl-10 pr-4 py-2 rounded-xl appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">No Workflow (Unassigned)</option>
                    {workflows?.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.isDefault && '(Default)'}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-caption" style={{ color: 'var(--text-tertiary)' }}>
                  Organize this project by assigning it to a workflow. Projects can be moved between workflows at any time.
                </p>
                {moveProjectToWorkflowMutation.isPending && (
                  <p className="mt-1 text-caption" style={{ color: 'var(--status-info)' }}>Moving project...</p>
                )}
              </div>
            </div>
          </div>

          {canManageProject ? (
            <div className="card rounded-3xl space-y-6">
              <div>
                <p className="text-sm font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>Project Lifecycle</p>
                <p className="text-sm mt-1 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
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
            <div className="card rounded-3xl">
              <p className="text-sm font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>Leave Project</p>
              <p className="text-sm mb-2 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                Remove your access to this project. You will need to be re-invited to regain access.
              </p>
              {isSoleOwner && (
                <p className="text-caption mb-4" style={{ color: 'var(--status-danger)' }}>
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
            <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
              className="input-theme w-full px-4 py-2 rounded-lg focus:ring-2"
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
            <p className="text-body-sm" style={{ color: 'var(--status-danger)' }}>
              Failed to send invitation. Please try again.
            </p>
          )}
        </div>
      </Modal>

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

