import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Filter, X, Download, Key, Folder, Users, Clock } from 'lucide-react';
import { auditService, type AuditLogsResponse } from '../services/audit';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import type { AuditLog } from '../types';

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
}

export const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { isPlatformAdmin } = useAuth();

  // Redirect non-platform admins
  if (!isPlatformAdmin) {
    navigate('/home');
    return null;
  }

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    action: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useQuery<AuditLogsResponse>({
    queryKey: ['activity', page, filters],
    queryFn: () =>
      auditService.listAuditLogs({
        page: page - 1,
        size: 50,
        action: filters.action || undefined,
        startDate: filters.startDate ? `${filters.startDate}T00:00:00` : undefined,
        endDate: filters.endDate ? `${filters.endDate}T23:59:59` : undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      action: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  const handleExport = () => {
    if (!data?.content?.length) return;
    const header = ['Timestamp', 'Action', 'Resource', 'User', 'IP Address'];
    const rows = data.content.map((log: AuditLog) => [
      new Date(log.createdAt || log.timestamp || '').toISOString(),
      log.action,
      log.resourceId || log.secretKey || '',
      log.user?.email || log.username || '',
      log.ipAddress ?? '',
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value: string) => {
            const safe = value.replace(/"/g, '""');
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
  };

  const hasActiveFilters = useMemo(
    () => filters.action || filters.startDate || filters.endDate,
    [filters]
  );

  const logs = data?.content ?? [];

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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
          <p className="mt-1 text-gray-500">
            Track all actions across your projects and secrets
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
            disabled={!logs.length}
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 shadow-sm focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm"
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 shadow-sm focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 shadow-sm focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">Failed to load activity. Please try again.</p>
        </div>
      ) : !logs.length ? (
        <EmptyState
          icon={<FileText className="h-16 w-16 text-gray-400" />}
          title="No activity yet"
          description={
            hasActiveFilters
              ? 'No activity matches your filters. Try adjusting them.'
              : 'Your activity feed will show actions across all your projects.'
          }
        />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {logs.map((log: AuditLog) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    ACTION_COLORS[log.action] === 'success' ? 'bg-green-100 text-green-600' :
                    ACTION_COLORS[log.action] === 'danger' ? 'bg-red-100 text-red-600' :
                    ACTION_COLORS[log.action] === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    ACTION_COLORS[log.action] === 'info' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {ACTION_ICONS[log.action] || <FileText className="h-4 w-4" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={ACTION_COLORS[log.action] || 'default'}>
                        {formatAction(log.action)}
                      </Badge>
                      {(log.resourceId || log.secretKey) && (
                        <span className="text-sm font-medium text-gray-900">
                          {log.resourceId || log.secretKey}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      by {log.user?.email || log.username || 'Unknown'}
                      {log.project && (
                        <span className="text-gray-400"> in {log.project.name}</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock className="h-4 w-4 mr-1" />
                    {getTimeAgo(log.createdAt || log.timestamp || '')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data?.totalPages && data.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
              className="mt-6"
            />
          )}

          {data && (
            <div className="text-center text-sm text-gray-500">
              Showing {logs.length} of {data.totalElements || 0} activities
            </div>
          )}
        </>
      )}
    </div>
  );
};

