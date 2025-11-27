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

export const SecretCard: React.FC<SecretCardProps> = ({
  secret,
  projectId,
  canManageSecrets,
  canDeleteSecrets,
  onView,
  onEdit,
  onDelete,
}) => {
  const isExpired = secret.expired || (secret.expiresAt && new Date(secret.expiresAt) < new Date());
  const versionList = secret.secretVersions;
  const lastVersionEntry = versionList && versionList.length > 0 ? versionList[versionList.length - 1] : undefined;
  const versionNumber = secret.version ?? lastVersionEntry?.versionNumber ?? 1;
  const lastChangeDate = lastVersionEntry?.createdAt ?? secret.updatedAt;
  const lastChangeUser =
    lastVersionEntry?.creator?.displayName ||
    lastVersionEntry?.creator?.email ||
    secret.creator?.displayName ||
    secret.creator?.email;
  const historyLink = `/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}#versions`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link
            to={`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 hover:underline block truncate"
          >
            <Key className="h-4 w-4 inline-block mr-2 text-gray-400" />
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
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="h-3 w-3 mr-1.5" />
          <span>Created: {new Date(secret.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="h-3 w-3 mr-1.5" />
          <span>Last change: {new Date(lastChangeDate).toLocaleDateString()}</span>
          {lastChangeUser && (
            <span className="ml-1 flex items-center">
              <User className="h-3 w-3 mr-1" />
              by {lastChangeUser}
            </span>
          )}
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <span>Version: v{versionNumber}</span>
          <Link to={historyLink} className="ml-2 text-blue-600 hover:underline">
            View history
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
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
};

