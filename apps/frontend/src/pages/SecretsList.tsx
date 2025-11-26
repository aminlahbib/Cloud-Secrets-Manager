import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ArrowUpDown, Eye, Edit, Trash2, Key } from 'lucide-react';
import { secretsService } from '../services/secrets';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import type { Secret, PaginatedResponse } from '../types';

type SecretsListResponse = PaginatedResponse<Secret>;

const PAGE_SIZE = 20;

type OwnerFilter = 'all' | 'mine' | 'specific';
type SortField = 'createdAt' | 'updatedAt' | 'key';

export const SecretsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [specificOwner, setSpecificOwner] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [secretToDelete, setSecretToDelete] = useState<string | null>(null);

  // Legacy permission checks - these pages will be deprecated in v3
  // For now, grant full access since permissions are now project-scoped
  const isAdmin = user?.platformRole === 'PLATFORM_ADMIN';
  const canWrite = true; // Will be determined by project membership in v3
  const canDelete = true;

  const createdByParam =
    ownerFilter === 'mine'
      ? user?.email
      : ownerFilter === 'specific' && specificOwner.trim()
      ? specificOwner.trim()
      : undefined;

  const { data, isLoading, error, isFetching } = useQuery<SecretsListResponse>({
    queryKey: ['secrets', page, searchTerm, createdByParam ?? 'all', sortBy, sortDir],
    queryFn: () =>
      secretsService.listSecrets({
        page: page - 1,
        size: PAGE_SIZE,
        keyword: searchTerm || undefined,
        createdBy: createdByParam,
        sortBy,
        sortDir,
      }),
    enabled: !!user,
    placeholderData: (previousData) => previousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => secretsService.deleteSecret(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      setSecretToDelete(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setPage(1);
  };

  const handleOwnerFilterChange = (value: OwnerFilter) => {
    setOwnerFilter(value);
    setPage(1);
    if (value !== 'specific') {
      setSpecificOwner('');
    }
  };

  const handleSortToggle = () => {
    setSortDir((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
  };

  const content: Secret[] = data?.content ?? [];
  const hasResults = content.length > 0;

  const renderStatus = (secret: (typeof content)[number]) => {
    const isExpired =
      secret.expired ||
      (secret.expiresAt ? new Date(secret.expiresAt).getTime() < Date.now() : false);

    if (isExpired) {
      return (
        <Badge variant="danger">
          Expired
        </Badge>
      );
    }

    if (secret.expiresAt) {
      return (
        <Badge variant="warning">
          Expires {new Date(secret.expiresAt).toLocaleDateString()}
        </Badge>
      );
    }

    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Secrets</h1>
          <p className="mt-2 text-sm text-gray-700">
            Browse, search, and manage encrypted secrets
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => navigate('/secrets/new')}
            className="inline-flex items-center"
            disabled={!canWrite}
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Secret
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by key or owner..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Search
              </Button>
              {searchTerm && (
                <Button type="button" variant="secondary" size="sm" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Filter
              </label>
              <select
                value={ownerFilter}
                onChange={(e) => handleOwnerFilterChange(e.target.value as OwnerFilter)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value="all">All accessible</option>
                <option value="mine">Created by me</option>
                {isAdmin && <option value="specific">Specific user</option>}
              </select>
            </div>

            {ownerFilter === 'specific' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Owner
                </label>
                <input
                  type="email"
                  value={specificOwner}
                  onChange={(e) => setSpecificOwner(e.target.value)}
                  placeholder="user@example.com"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value="createdAt">Created date</option>
                <option value="updatedAt">Updated date</option>
                <option value="key">Key name</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSortToggle}
                className="w-full"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {sortDir === 'DESC' ? 'Newest first' : 'Oldest first'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">
            Failed to load secrets. Please try again.
          </p>
        </div>
      ) : !hasResults ? (
        <EmptyState
          icon={<Key className="h-16 w-16 text-gray-400" />}
          title={searchTerm ? 'No secrets match your search' : 'No secrets yet'}
          description={
            searchTerm
              ? `No secrets match "${searchTerm}". Try a different search term.`
              : 'Get started by creating your first secret. Secrets are encrypted and stored securely.'
          }
          action={
            canWrite
              ? {
                  label: 'Create Secret',
                  onClick: () => navigate('/secrets/new'),
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
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
                  {content.map((secret: Secret) => {
                    const secretKey = secret.key || secret.secretKey || '';
                    return (
                      <tr key={secretKey} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="text-sm font-medium text-purple-700 cursor-pointer hover:underline"
                            onClick={() => navigate(`/secrets/${encodeURIComponent(secretKey)}`)}
                        >
                            {secretKey}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {secret.createdBy || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(secret.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(secret.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {renderStatus(secret)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                            onClick={() => navigate(`/secrets/${encodeURIComponent(secretKey)}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canWrite && (
                          <Button
                            variant="ghost"
                            size="sm"
                              onClick={() => navigate(`/secrets/${encodeURIComponent(secretKey)}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                              onClick={() => setSecretToDelete(secretKey)}
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
            {isFetching && (
              <div className="flex items-center justify-center py-4 border-t border-gray-100 text-sm text-gray-500">
                Refreshing data…
              </div>
            )}
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
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing page {page} of {data.totalPages} •{' '}
              {data.totalElements} total secrets
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={!!secretToDelete}
        onClose={() => setSecretToDelete(null)}
        title="Delete Secret"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete{' '}
            <strong>{secretToDelete}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setSecretToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => secretToDelete && deleteMutation.mutate(secretToDelete)}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
          {deleteMutation.isError && (
            <p className="text-sm text-red-600">
              Failed to delete the secret. Please try again.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

