import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Filter, X, Download, Key, Folder, Users, Clock } from 'lucide-react';
import { auditService } from '../services/audit';
import { projectsService } from '../services/projects';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
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
};

interface FilterState {
  action: string;
  startDate: string;
  endDate: string;
  projectId: string;
}

export const ActivityPage: React.FC = () => {
  const { user, isPlatformAdmin } = useAuth();
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
    staleTime: 30 * 1000, // 30 seconds - activity is real-time data
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Activity</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isPlatformAdmin 
              ? 'Track all actions across all projects and secrets' 
              : 'Track all actions across your accessible projects and secrets'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={!paginatedLogs.length}
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Project
              </label>
              <select
                value={filters.projectId}
                onChange={(e) => handleFilterChange('projectId', e.target.value)}
                className="input-theme"
              >
                <option value="">All Projects</option>
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
                <option value="">All Actions</option>
                <optgroup label="Secrets">
                  <option value="SECRET_CREATE">Secret Created</option>
                  <option value="SECRET_READ">Secret Read</option>
                  <option value="SECRET_UPDATE">Secret Updated</option>
                  <option value="SECRET_DELETE">Secret Deleted</option>
                  <option value="SECRET_ROTATE">Secret Rotated</option>
                </optgroup>
                <optgroup label="Projects">
                  <option value="PROJECT_CREATE">Project Created</option>
                  <option value="PROJECT_UPDATE">Project Updated</option>
                  <option value="PROJECT_DELETE">Project Deleted</option>
                </optgroup>
                <optgroup label="Members">
                  <option value="MEMBER_INVITE">Member Invited</option>
                  <option value="MEMBER_JOIN">Member Joined</option>
                  <option value="MEMBER_REMOVE">Member Removed</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Start Date
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
                End Date
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
            Failed to load activity. {error instanceof Error ? error.message : 'Please try again.'}
          </p>
        </div>
      ) : !paginatedLogs.length ? (
        <EmptyState
          icon={<FileText className="h-16 w-16" style={{ color: 'var(--text-tertiary)' }} />}
          title="No activity yet"
          description={
            hasActiveFilters
              ? 'No activity matches your filters. Try adjusting them.'
              : projects.length === 0
              ? 'You don\'t have access to any projects yet.'
              : 'Your activity feed will show actions across all your accessible projects.'
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
                      </div>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        by {log.userEmail || log.user?.email || 'Unknown'}
                        {log.project && (
                          <span style={{ color: 'var(--text-tertiary)' }}> in {log.project.name}</span>
                        )}
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

