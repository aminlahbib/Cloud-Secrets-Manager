import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Filter, X, Download, Key, Folder, Users, Clock, Building2 } from 'lucide-react';
import { auditService } from '../services/audit';
import { projectsService } from '../services/projects';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import type { AuditLog, Project } from '../types';

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

interface FilterState {
  action: string;
  startDate: string;
  endDate: string;
  projectId: string;
}

export const ActivityPage: React.FC = () => {
  const { user, isPlatformAdmin } = useAuth();
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 50;

  const [filters, setFilters] = useState<FilterState>({
    action: '',
    startDate: '',
    endDate: '',
    projectId: '',
  });

  // Fetch all projects the user has access to
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectsService.listProjects({ size: 1000 }), // Get all projects
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const projects = projectsData?.content ?? [];

  // Fetch activities from all accessible projects
  const { data: activitiesData, isLoading: isActivitiesLoading, error } = useQuery<{
    logs: AuditLog[];
    totalCount: number;
  }>({
    queryKey: ['activity', 'all-projects', filters, projects.length],
    queryFn: async () => {
      if (projects.length === 0) {
        return { logs: [], totalCount: 0 };
      }

      // If platform admin, use the global endpoint (more efficient)
      if (isPlatformAdmin) {
        try {
          const response = await auditService.listAuditLogs({
            page: 0,
            size: 1000, // Get more items to filter client-side
            action: filters.action || undefined,
            startDate: filters.startDate ? `${filters.startDate}T00:00:00` : undefined,
            endDate: filters.endDate ? `${filters.endDate}T23:59:59` : undefined,
          });
          return {
            logs: response.content || [],
            totalCount: response.totalElements || 0,
          };
        } catch (err: any) {
          // If 403, fall through to project-by-project fetching
          if (err.response?.status !== 403) {
            throw err;
          }
        }
      }

      // For regular users or if admin endpoint fails, fetch from each project
      const projectIds = filters.projectId
        ? [filters.projectId]
        : projects.map((p: Project) => p.id);

      // Fetch activities from all projects in parallel
      const activityPromises = projectIds.map(async (projectId: string) => {
        try {
          const params: any = {
            page: 0,
            size: 100, // Get more items per project
            action: filters.action || undefined,
          };

          if (filters.startDate && filters.endDate) {
            params.startDate = `${filters.startDate}T00:00:00`;
            params.endDate = `${filters.endDate}T23:59:59`;
          }

          const response = await auditService.getProjectAuditLogs(projectId, params);
          return response.content || [];
        } catch (err: any) {
          // Skip projects user doesn't have access to
          if (err.response?.status === 403 || err.response?.status === 404) {
            return [];
          }
          throw err;
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

      // Apply date filter if not already applied server-side
      let filtered = sorted;
      if (filters.startDate && !filters.endDate) {
        const startDate = new Date(`${filters.startDate}T00:00:00`);
        filtered = filtered.filter((log) => new Date(log.createdAt || 0) >= startDate);
      }
      if (filters.endDate && !filters.startDate) {
        const endDate = new Date(`${filters.endDate}T23:59:59`);
        filtered = filtered.filter((log) => new Date(log.createdAt || 0) <= endDate);
      }

      return {
        logs: filtered,
        totalCount: filtered.length,
      };
    },
    enabled: !!user?.id && (projects.length > 0 || isProjectsLoading === false),
    staleTime: 5 * 60 * 1000, // 5 minutes - preserve audit data across sessions
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes even when not in use
  });

  const isLoading = isProjectsLoading || isActivitiesLoading;

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      action: '',
      startDate: '',
      endDate: '',
      projectId: '',
    });
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    if (!activitiesData?.logs?.length) return;
    const header = ['Timestamp', 'Action', 'Resource', 'User', 'Project', 'IP Address'];
    const rows = activitiesData.logs.map((log: AuditLog) => [
      new Date(log.createdAt || '').toISOString(),
      log.action,
      log.resourceName || log.resourceId || '',
      log.userEmail || log.user?.email || '',
      log.project?.name || '',
      log.ipAddress ?? '',
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value: string) => {
            const safe = String(value).replace(/"/g, '""');
            return `"${safe}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [activitiesData?.logs]);

  const hasActiveFilters = useMemo(
    () => filters.action || filters.startDate || filters.endDate || filters.projectId,
    [filters]
  );

  // Client-side pagination
  const paginatedLogs = useMemo(() => {
    if (!activitiesData?.logs) return [];
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return activitiesData.logs.slice(start, end);
  }, [activitiesData?.logs, page, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (!activitiesData?.totalCount) return 0;
    return Math.ceil(activitiesData.totalCount / itemsPerPage);
  }, [activitiesData?.totalCount, itemsPerPage]);

  const formatAction = useCallback((action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  const getTimeAgo = useCallback((timestamp: string) => {
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
  }, [t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">
            {t('activity.title')}
          </h1>
          <p className="text-body-sm text-theme-secondary mt-1">
            {isPlatformAdmin
              ? t('activity.subtitle.admin')
              : t('activity.subtitle.user')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-5 w-5 mr-2" />
            {showFilters ? t('activity.hideFilters') : t('activity.filters')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={!paginatedLogs.length}
          >
            <Download className="h-5 w-5 mr-2" />
            {t('activity.export')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t('activity.filters.project')}
              </label>
              <select
                value={filters.projectId}
                onChange={(e) => handleFilterChange('projectId', e.target.value)}
                className="input-theme"
              >
                <option value="">{t('activity.filters.allProjects')}</option>
                {projects.map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="input-theme"
              >
                <option value="">{t('activity.filters.allActions')}</option>
                <optgroup label={t('activity.filters.secrets')}>
                  <option value="SECRET_CREATE">{t('activity.filters.secretCreated')}</option>
                  <option value="SECRET_READ">{t('activity.filters.secretRead')}</option>
                  <option value="SECRET_UPDATE">{t('activity.filters.secretUpdated')}</option>
                  <option value="SECRET_DELETE">{t('activity.filters.secretDeleted')}</option>
                  <option value="SECRET_ROTATE">{t('activity.filters.secretRotated')}</option>
                </optgroup>
                <optgroup label={t('activity.filters.projects')}>
                  <option value="PROJECT_CREATE">{t('activity.filters.projectCreated')}</option>
                  <option value="PROJECT_UPDATE">{t('activity.filters.projectUpdated')}</option>
                  <option value="PROJECT_DELETE">{t('activity.filters.projectDeleted')}</option>
                </optgroup>
                <optgroup label={t('activity.filters.members')}>
                  <option value="MEMBER_INVITE">{t('activity.filters.memberInvited')}</option>
                  <option value="MEMBER_JOIN">{t('activity.filters.memberJoined')}</option>
                  <option value="MEMBER_REMOVE">{t('activity.filters.memberRemoved')}</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t('activity.filters.startDate')}
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t('activity.filters.endDate')}
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input-theme"
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button variant="secondary" onClick={handleClearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)' }}>
          <p className="text-sm" style={{ color: 'var(--status-danger)' }}>
            {t('common.error')}{' '}
            {error instanceof Error ? error.message : t('projects.failedToLoad')}
          </p>
        </div>
      ) : !paginatedLogs.length ? (
        <EmptyState
          icon={<FileText className="h-16 w-16" style={{ color: 'var(--text-tertiary)' }} />}
          title={t('activity.noActivity')}
          description={
            hasActiveFilters
              ? t('activity.noMatches')
              : projects.length === 0
              ? t('activity.noAccess')
              : t('activity.feedDescription')
          }
        />
      ) : (
        <>
          <div className="rounded-lg border divide-y" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)', borderTopColor: 'var(--border-subtle)' }}>
            {paginatedLogs.map((log: AuditLog) => {
              const actionColor = ACTION_COLORS[log.action] || 'default';
              const iconBgStyles = {
                success: { backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)' },
                danger: { backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)' },
                warning: { backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning)' },
                info: { backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info)' },
                default: { backgroundColor: 'var(--elevation-1)', color: 'var(--text-secondary)' },
              };
              
              // Get project from log.project or lookup from projects array
              const project = log.project || (log.projectId ? projects.find((p: Project) => p.id === log.projectId) : null);
              const projectName = project?.name || log.metadata?.projectName as string;
              
              // Get team name(s) from project.teams or metadata
              // Projects have teams array with { teamId, teamName }
              let teamName: string | undefined;
              if (project?.teams && project.teams.length > 0) {
                // Use the first team the user is a member of
                teamName = project.teams[0]?.teamName;
              } else if (log.metadata?.teamName) {
                // Fallback to metadata
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

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-6"
            />
          )}

          {activitiesData && (
            <div className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Showing {paginatedLogs.length} of {activitiesData.totalCount || 0} activities
              {projects.length > 0 && ` across ${projects.length} project${projects.length !== 1 ? 's' : ''}`}
            </div>
          )}
        </>
      )}
    </div>
  );
};

