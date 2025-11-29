import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, Key, Clock, User } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import type { Secret } from '../../types';

interface SecretCardProps {
  secret: Secret;
  projectId: string;
  canManageSecrets: boolean;
  canDeleteSecrets: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const SecretCard: React.FC<SecretCardProps> = React.memo(({
  secret,
  projectId,
  canManageSecrets,
  canDeleteSecrets,
  onView,
  onEdit,
  onDelete,
}) => {
  const isExpired = React.useMemo(() => 
    secret.expired || (secret.expiresAt && new Date(secret.expiresAt) < new Date()),
    [secret.expired, secret.expiresAt]
  );
  const versionList = secret.secretVersions;
  const lastVersionEntry = React.useMemo(() => 
    versionList && versionList.length > 0 ? versionList[versionList.length - 1] : undefined,
    [versionList]
  );
  const versionNumber = React.useMemo(() => 
    secret.version ?? lastVersionEntry?.versionNumber ?? 1,
    [secret.version, lastVersionEntry?.versionNumber]
  );
  const lastChangeDate = React.useMemo(() => 
    lastVersionEntry?.createdAt ?? secret.updatedAt,
    [lastVersionEntry?.createdAt, secret.updatedAt]
  );
  const lastChangeUser = React.useMemo(() =>
    lastVersionEntry?.creator?.displayName ||
    lastVersionEntry?.creator?.email ||
    secret.creator?.displayName ||
    secret.creator?.email,
    [lastVersionEntry?.creator, secret.creator]
  );
  const historyLink = React.useMemo(() => 
    `/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}#versions`,
    [projectId, secret.secretKey]
  );

  return (
    <div 
      className="rounded-lg border p-4 hover:shadow-md transition-all duration-150"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link
            to={`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`}
            className="text-body-sm font-semibold hover:underline block truncate transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            <Key className="h-4 w-4 inline-block mr-2" style={{ color: 'var(--text-tertiary)' }} />
            {secret.secretKey}
          </Link>
        </div>
        <div className="ml-2">
          {isExpired ? (
            <Badge variant="danger">Expired</Badge>
          ) : secret.expiresAt ? (
            <Badge variant="warning">Expires {new Date(secret.expiresAt).toLocaleDateString()}</Badge>
          ) : (
            <Badge variant="default">Active</Badge>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-caption" style={{ color: 'var(--text-tertiary)' }}>
          <Clock className="h-3 w-3 mr-1.5" />
          <span>Created: {new Date(secret.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-caption" style={{ color: 'var(--text-tertiary)' }}>
          <Clock className="h-3 w-3 mr-1.5" />
          <span>Last change: {new Date(lastChangeDate).toLocaleDateString()}</span>
          {lastChangeUser && (
            <span className="ml-1 flex items-center">
              <User className="h-3 w-3 mr-1" />
              by {lastChangeUser}
            </span>
          )}
        </div>
        <div className="flex items-center text-caption" style={{ color: 'var(--text-tertiary)' }}>
          <span>Version: v{versionNumber}</span>
          <Link 
            to={historyLink} 
            className="ml-2 hover:underline transition-colors"
            style={{ color: 'var(--accent-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
          >
            View history
          </Link>
        </div>
      </div>

      <div 
        className="flex items-center gap-2 pt-3 border-t"
        style={{ borderTopColor: 'var(--border-subtle)' }}
      >
        <Button variant="ghost" size="sm" onClick={onView} className="flex-1">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        {canManageSecrets && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="flex-1">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {canDeleteSecrets && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

