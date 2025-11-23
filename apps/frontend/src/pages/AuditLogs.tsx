import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, User, Clock, Filter, X } from 'lucide-react';
import { auditService } from '../services/audit';
import { Spinner } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';

const ACTION_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  CREATE: 'success',
  READ: 'info',
  UPDATE: 'warning',
  DELETE: 'danger',
  SHARE: 'info',
  ROTATE: 'warning',
};

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    username: '',
    action: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch audit logs
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () =>
      auditService.listAuditLogs({
        page: page - 1,
        size: 50,
        ...filters,
      }),
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ username: '', action: '' });
    setPage(1);
  };

  const hasActiveFilters = filters.username || filters.action;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track all actions performed on secrets
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 mb-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Email
              </label>
              <input
                type="text"
                value={filters.username}
                onChange={(e) => handleFilterChange('username', e.target.value)}
                placeholder="Filter by user..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="READ">Read</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="SHARE">Share</option>
                <option value="ROTATE">Rotate</option>
              </select>
            </div>
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">
            Failed to load audit logs. Please try again.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!data || !data.content || data.content.length === 0) && (
        <EmptyState
          icon={<FileText className="h-16 w-16 text-gray-400" />}
          title="No audit logs found"
          description={
            hasActiveFilters
              ? 'No logs match your filters. Try adjusting your search criteria.'
              : 'No audit logs available yet. Activity will appear here as you use the system.'
          }
        />
      )}

      {/* Audit Logs List */}
      {!isLoading && !error && data && data.content && data.content.length > 0 && (
        <>
          <div className="space-y-3">
            {data.content.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant={ACTION_COLORS[log.action] || 'default'}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {log.secretKey || 'Unknown Secret'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {log.username}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.ipAddress && (
                        <div className="flex items-center">
                          <span className="text-gray-400">IP:</span>
                          <span className="ml-1">{log.ipAddress}</span>
                        </div>
                      )}
                    </div>

                    {log.details && (
                      <p className="mt-2 text-sm text-gray-600">{log.details}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data.page && data.page.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.page.totalPages}
              onPageChange={setPage}
              className="mt-8"
            />
          )}

          {/* Results count */}
          {data.page && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing {data.content.length} of {data.page.totalElements || 0} logs
            </div>
          )}
        </>
      )}
    </div>
  );
};

