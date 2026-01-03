import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Filter, X, Download } from 'lucide-react';
import { auditService, type AuditLogsResponse } from '../services/audit';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useI18n } from '../contexts/I18nContext';
import type { AuditLog } from '../types';

const ACTION_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  CREATE: 'success',
  READ: 'info',
  UPDATE: 'warning',
  DELETE: 'danger',
  SHARE: 'info',
  ROTATE: 'warning',
  UNSHARE: 'warning',
};

interface FilterState {
  action: string;
  resourceType: string;
  startDate: string;
  endDate: string;
}

export const AuditLogsPage: React.FC = () => {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', page, filters],
    queryFn: () =>
      auditService.listAuditLogs({
        page: page - 1,
        size: 50,
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
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
      resourceType: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  const handleExport = () => {
    if (!data?.content?.length) return;
    const header = ['Timestamp', 'Action', 'Resource Type', 'Resource Name', 'User', 'IP Address'];
    const rows = data.content.map((log: AuditLog) => [
      new Date(log.createdAt || '').toISOString(),
      log.action,
      log.resourceType || '',
      log.resourceName || log.resourceId || '',
      log.userEmail || log.user?.email || '',
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
    link.download = `audit-logs-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = useMemo(
    () =>
      filters.action ||
      filters.resourceType ||
      filters.startDate ||
      filters.endDate,
    [filters]
  );

  const logs = data?.content ?? [];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Audit Logs</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            End-to-end trace of secret access, changes, and sharing events
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={!logs.length}
          >
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="input-theme"
              >
                <option value="">{t('auditLogs.all')}</option>
                <option value="SECRET_CREATE">{t('auditLogs.secretCreate')}</option>
                <option value="SECRET_READ">{t('auditLogs.secretRead')}</option>
                <option value="SECRET_UPDATE">{t('auditLogs.secretUpdate')}</option>
                <option value="SECRET_DELETE">{t('auditLogs.secretDelete')}</option>
                <option value="SECRET_ROTATE">{t('auditLogs.secretRotate')}</option>
                <option value="PROJECT_CREATE">{t('auditLogs.projectCreate')}</option>
                <option value="PROJECT_UPDATE">{t('auditLogs.projectUpdate')}</option>
                <option value="MEMBER_INVITE">{t('auditLogs.memberInvite')}</option>
                <option value="MEMBER_REMOVE">{t('auditLogs.memberRemove')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t('auditLogs.resourceType')}
              </label>
              <select
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className="input-theme"
              >
                <option value="">{t('auditLogs.all')}</option>
                <option value="SECRET">{t('auditLogs.secret')}</option>
                <option value="PROJECT">{t('auditLogs.project')}</option>
                <option value="MEMBER">{t('auditLogs.member')}</option>
                <option value="WORKFLOW">{t('auditLogs.workflow')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t('auditLogs.startDate')}
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
                {t('auditLogs.endDate')}
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input-theme"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)' }}>
          <p className="text-sm" style={{ color: 'var(--status-danger)' }}>Failed to load audit logs. Please try again.</p>
        </div>
      ) : !logs.length ? (
        <EmptyState
          icon={<FileText className="h-16 w-16" style={{ color: 'var(--text-tertiary)' }} />}
          title="No audit logs found"
          description={
            hasActiveFilters
              ? 'No logs match your filters. Try adjusting them.'
              : 'No activity recorded yet. Actions will show up here automatically.'
          }
        />
      ) : (
        <>
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
            <div className="overflow-x-auto">
              <table className="min-w-full" style={{ borderColor: 'var(--border-subtle)' }}>
                <thead style={{ backgroundColor: 'var(--table-header-bg)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Resource Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Resource Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: 'var(--table-body-bg)' }}>
                  {logs.map((log: AuditLog) => (
                    <tr key={log.id} style={{ borderTop: '1px solid var(--table-divider)' }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(log.createdAt || '').toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={ACTION_COLORS[log.action] || 'default'}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>{log.resourceType || '—'}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>{log.resourceName || log.resourceId || '—'}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>{log.userDisplayName || log.userEmail || log.user?.email || 'Unknown'}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{log.ipAddress || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data?.totalPages && data.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
              className="mt-8"
            />
          )}

          {data && (
            <div className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Showing {logs.length} of {data.totalElements || 0} logs
            </div>
          )}
        </>
      )}
    </div>
  );
};

