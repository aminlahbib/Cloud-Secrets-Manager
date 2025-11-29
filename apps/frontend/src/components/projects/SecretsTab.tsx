import React, { useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Eye, Edit, Trash2, Key } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FilterPanel, FilterConfig } from '../ui/FilterPanel';
import { SecretCard } from '../ui/SecretCard';
import { DataTable, Column } from '../ui/DataTable';
import type { Secret } from '../../types';

interface SecretsTabProps {
  projectId: string;
  secrets: Secret[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  secretFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onFilterClear: () => void;
  secretFilterConfigs: FilterConfig[];
  selectedSecrets: Set<string>;
  onToggleSelection: (key: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  canManageSecrets: boolean;
  canDeleteSecrets: boolean;
  onDeleteSecret: (key: string) => void;
  onBulkDelete: () => void;
  isBulkDeleting: boolean;
}


export const SecretsTab: React.FC<SecretsTabProps> = React.memo(({
  projectId,
  secrets,
  isLoading,
  searchTerm,
  onSearchChange,
  secretFilters,
  onFilterChange,
  onFilterClear,
  secretFilterConfigs,
  selectedSecrets,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  canManageSecrets,
  canDeleteSecrets,
  onDeleteSecret,
  onBulkDelete,
  isBulkDeleting,
}) => {
  const navigate = useNavigate();

  const handleView = useCallback((key: string) => {
    navigate(`/projects/${projectId}/secrets/${encodeURIComponent(key)}`);
  }, [navigate, projectId]);

  const handleEdit = useCallback((key: string) => {
    navigate(`/projects/${projectId}/secrets/${encodeURIComponent(key)}/edit`);
  }, [navigate, projectId]);

  const handleDelete = useCallback((key: string) => {
    onDeleteSecret(key);
  }, [onDeleteSecret]);

  return (
    <div className="tab-content-container space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-theme-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search secrets..."
            className="input-theme pl-10 pr-4 py-2"
          />
        </div>
        <FilterPanel
          filters={secretFilterConfigs}
          values={secretFilters}
          onChange={onFilterChange}
          onClear={onFilterClear}
        />
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedSecrets.size > 0 && canDeleteSecrets && (
        <div className="border border-status-info rounded-lg p-4 flex items-center justify-between bg-status-info-bg">
          <div className="flex items-center gap-3">
            <span className="text-body-sm font-medium text-status-info">
              {selectedSecrets.size} secret{selectedSecrets.size !== 1 ? 's' : ''} selected
            </span>
            <Button variant="ghost" size="sm" onClick={onClearSelection} className="text-status-info">
              Clear
            </Button>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={onBulkDelete}
            disabled={isBulkDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <DataTable
        data={secrets}
        columns={useMemo<Column<Secret>[]>(() => [
          {
            key: 'secretKey',
            header: 'Key',
            render: (secret) => (
              <Link
                to={`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`}
                className="text-body-sm font-medium hover:underline text-theme-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {secret.secretKey}
              </Link>
            ),
          },
          {
            key: 'createdAt',
            header: 'Created',
            render: (secret) => (
              <span className="text-body-sm text-theme-secondary">
                {new Date(secret.createdAt).toLocaleDateString()}
              </span>
            ),
          },
          {
            key: 'lastChange',
            header: 'Last Change',
            render: (secret) => {
              const versionList = secret.secretVersions;
              const lastVersionEntry = versionList && versionList.length > 0 ? versionList[versionList.length - 1] : undefined;
              const lastChangeDate = lastVersionEntry?.createdAt ?? secret.updatedAt;
              const lastChangeUser =
                lastVersionEntry?.creator?.displayName ||
                lastVersionEntry?.creator?.email ||
                secret.creator?.displayName ||
                secret.creator?.email;
              return (
                <div>
                  <div className="text-body-sm text-theme-primary">{new Date(lastChangeDate).toLocaleDateString()}</div>
                  {lastChangeUser && <div className="text-caption text-theme-tertiary">by {lastChangeUser}</div>}
                </div>
              );
            },
          },
          {
            key: 'version',
            header: 'Version',
            render: (secret) => {
              const versionList = secret.secretVersions;
              const lastVersionEntry = versionList && versionList.length > 0 ? versionList[versionList.length - 1] : undefined;
              const versionNumber = secret.version ?? lastVersionEntry?.versionNumber ?? 1;
              const historyLink = `/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}#versions`;
              return (
                <div>
                  <div className="text-body-sm font-medium text-theme-primary">v{versionNumber}</div>
                  <Link
                    to={historyLink}
                    className="text-caption transition-colors text-theme-tertiary hover:text-theme-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View history
                  </Link>
                </div>
              );
            },
          },
          {
            key: 'status',
            header: 'Status',
            render: (secret) => {
              const isExpired = secret.expired || (secret.expiresAt && new Date(secret.expiresAt) < new Date());
              return isExpired ? (
                <Badge variant="danger">Expired</Badge>
              ) : secret.expiresAt ? (
                <Badge variant="warning">
                  Expires {new Date(secret.expiresAt).toLocaleDateString()}
                </Badge>
              ) : (
                <Badge variant="default">Active</Badge>
              );
            },
          },
        ], [projectId])}
        loading={isLoading}
        emptyState={{
          icon: <Key className="h-16 w-16 text-theme-tertiary" />,
          title: searchTerm ? 'No secrets match your search' : 'No secrets yet',
          description: searchTerm ? 'Try a different search term' : 'Add your first secret to this project',
          action: canManageSecrets
            ? {
                label: 'Add Secret',
                onClick: () => navigate(`/projects/${projectId}/secrets/new`),
              }
            : undefined,
        }}
        rowKey={(secret) => secret.id || secret.secretKey}
        showCheckboxes={canDeleteSecrets}
        selectedItems={selectedSecrets}
        onSelectItem={onToggleSelection}
        onSelectAll={onSelectAll}
        renderRowActions={(secret) => (
          <>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleView(secret.secretKey); }}>
              <Eye className="h-4 w-4" />
            </Button>
            {canManageSecrets && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(secret.secretKey); }}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDeleteSecrets && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(secret.secretKey); }}>
                <Trash2 className="h-4 w-4 text-status-danger" />
              </Button>
            )}
          </>
        )}
        mobileCardView={(secret) => (
          <SecretCard
            secret={secret}
            projectId={projectId}
            canManageSecrets={canManageSecrets}
            canDeleteSecrets={canDeleteSecrets}
            onView={() => navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`)}
            onEdit={() => navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}/edit`)}
            onDelete={() => onDeleteSecret(secret.secretKey)}
          />
        )}
      />
    </div>
  );
});

SecretsTab.displayName = 'SecretsTab';

