import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Key, Calendar, Tag } from 'lucide-react';
import { secretsService } from '../services/secrets';
import { Spinner } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';

export const SecretsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Fetch secrets
  const { data, isLoading, error } = useQuery({
    queryKey: ['secrets', page, search],
    queryFn: () =>
      secretsService.listSecrets({
        page: page - 1, // Backend uses 0-based indexing
        size: 20,
        search,
        sort: 'createdAt,desc',
      }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1); // Reset to first page on search
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const content = data?.content ?? [];
  const pagination = data?.page;
  const hasResults = content.length > 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Secrets</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your encrypted secrets securely
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => navigate('/secrets/new')}
            className="inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Secret
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by key name..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
          <Button type="submit">Search</Button>
          {search && (
            <Button type="button" variant="secondary" onClick={handleClearSearch}>
              Clear
            </Button>
          )}
        </form>
      </div>

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
            Failed to load secrets. Please try again.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && content.length === 0 && !search && (
        <EmptyState
          icon={<Key className="h-16 w-16 text-gray-400" />}
          title="No secrets yet"
          description="Get started by creating your first secret. Secrets are encrypted and stored securely."
          action={{
            label: 'Create Secret',
            onClick: () => navigate('/secrets/new'),
          }}
        />
      )}

      {/* No Search Results */}
      {!isLoading && !error && content.length === 0 && search && (
        <EmptyState
          icon={<Search className="h-16 w-16 text-gray-400" />}
          title="No secrets found"
          description={`No secrets match "${search}". Try a different search term.`}
          action={{
            label: 'Clear Search',
            onClick: handleClearSearch,
          }}
        />
      )}

      {/* Secrets List */}
      {!isLoading && !error && hasResults && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {content.map((secret) => (
              <Card
                key={secret.id ?? secret.key}
                hover
                onClick={() => navigate(`/secrets/${encodeURIComponent(secret.key)}`)}
                className="p-4"
              >
                {/* Secret Key */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                    {secret.key}
                  </h3>
                  <Key className="h-5 w-5 text-purple-600 ml-2 flex-shrink-0" />
                </div>

                {/* Description */}
                {secret.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {secret.description}
                  </p>
                )}

                {/* Tags */}
                  {secret.tags && secret.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {secret.tags.slice(0, 3).map((tag) => (
                      <Badge key={`${secret.id ?? secret.key}-${tag}`} variant="info">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {secret.tags.length > 3 && (
                      <Badge variant="default">+{secret.tags.length - 3}</Badge>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {new Date(secret.createdAt).toLocaleDateString()}
                  </div>
                  {secret.version && (
                    <div className="flex items-center">
                      <span>v{secret.version}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {(pagination?.totalPages ?? 0) > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination?.totalPages ?? 1}
              onPageChange={setPage}
              className="mt-8"
            />
          )}

          {/* Results count */}
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing {content.length} of {pagination?.totalElements ?? content.length} secrets
          </div>
        </>
      )}
    </div>
  );
};

