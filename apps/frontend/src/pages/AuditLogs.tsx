import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Filter, X, Download } from 'lucide-react';
import { auditService, type AuditLogsResponse } from '../services/audit';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
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
  username: string;
  action: string;
  secretKey: string;
  startDate: string;
  endDate: string;
}

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    username: '',
    action: '',
    secretKey: '',
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
        username: filters.username || undefined,
        action: filters.action || undefined,
        secretKey: filters.secretKey || undefined,
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
      username: '',
      action: '',
      secretKey: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  const handleExport = () => {
    if (!data?.content?.length) return;
    const header = ['Timestamp', 'Action', 'Secret Key', 'User', 'IP Address', 'Details'];
    const rows = data.content.map((log: AuditLog) => [
      new Date(log.timestamp || log.createdAt || '').toISOString(),
      log.action,
      log.secretKey ?? '',
      log.username || '',
      log.ipAddress ?? '',
      log.details ?? '',
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
      filters.username ||
      filters.action ||
      filters.secretKey ||
      filters.startDate ||
      filters.endDate,
    [filters]
  );

  const logs = data?.content ?? [];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-sm text-gray-700">
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
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Email
              </label>
              <input
                type="email"
                value={filters.username}
                onChange={(e) => handleFilterChange('username', e.target.value)}
                placeholder="user@example.com"
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm bg-white"
              >
                <option value="">All</option>
                <option value="CREATE">Create</option>
                <option value="READ">Read</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="SHARE">Share</option>
                <option value="UNSHARE">Unshare</option>
                <option value="ROTATE">Rotate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Key
              </label>
              <input
                type="text"
                value={filters.secretKey}
                onChange={(e) => handleFilterChange('secretKey', e.target.value)}
                placeholder="api-key-prod"
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm bg-white"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">Failed to load audit logs. Please try again.</p>
        </div>
      ) : !logs.length ? (
        <EmptyState
          icon={<FileText className="h-16 w-16 text-gray-400" />}
          title="No audit logs found"
          description={
            hasActiveFilters
              ? 'No logs match your filters. Try adjusting them.'
              : 'No activity recorded yet. Actions will show up here automatically.'
          }
        />
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Secret Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log: AuditLog) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(log.timestamp || log.createdAt || '').toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={ACTION_COLORS[log.action] || 'default'}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.secretKey || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.ipAddress || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.details || '—'}
                      </td>
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
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing {logs.length} of {data.totalElements || 0} logs
            </div>
          )}
        </>
      )}
    </div>
  );
};

