import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Share2,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { secretsService, type ShareSecretPayload } from '../services/secrets';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

export const SecretDetailPage: React.FC = () => {
  const { key: keyParam, projectId } = useParams<{ key: string; projectId?: string }>();
  const secretKey = keyParam ? decodeURIComponent(keyParam) : '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useAuth(); // For authentication check
  const isProjectScoped = !!projectId;

  const [showValue, setShowValue] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingUnshare, setPendingUnshare] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShareSecretPayload>({
    defaultValues: {
      sharedWith: '',
      permission: 'READ',
    },
  });

  const { data: secret, isLoading, error } = useQuery({
    queryKey: isProjectScoped ? ['project-secret', projectId, secretKey] : ['secret', secretKey],
    queryFn: () => isProjectScoped && projectId
      ? secretsService.getProjectSecret(projectId, secretKey)
      : secretsService.getSecret(secretKey),
    enabled: !!secretKey,
  });

  // Versions and sharing are not available for project-scoped secrets yet
  const { data: versions, isLoading: isVersionsLoading } = useQuery({
    queryKey: ['secret', secretKey, 'versions'],
    queryFn: () => secretsService.getSecretVersions(secretKey),
    enabled: !!secretKey && !isProjectScoped,
  });

  const {
    data: sharedUsers,
    isLoading: isSharingLoading,
    error: sharingError,
  } = useQuery({
    queryKey: ['secret', secretKey, 'shared-users'],
    queryFn: () => secretsService.getSharedUsers(secretKey),
    enabled: !!secretKey && !isProjectScoped,
  });

  // Legacy permission checks - these pages will be deprecated in v3
  // For now, grant full access since permissions are now project-scoped
  const canWrite = true; // Will be determined by project membership in v3
  const canDelete = true;
  const canShare = true;
  const canRotate = true;

  const deleteMutation = useMutation({
    mutationFn: () => isProjectScoped && projectId
      ? secretsService.deleteProjectSecret(projectId, secretKey)
      : secretsService.deleteSecret(secretKey),
    onSuccess: () => {
      if (isProjectScoped && projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
        navigate(`/projects/${projectId}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['secrets'] });
        navigate('/secrets');
      }
    },
  });

  const shareMutation = useMutation({
    mutationFn: (payload: ShareSecretPayload) => secretsService.shareSecret(secretKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secret', secretKey, 'shared-users'] });
      reset();
      setShowShareModal(false);
    },
  });

  const unshareMutation = useMutation({
    mutationFn: (sharedWith: string) => secretsService.unshareSecret(secretKey, sharedWith),
    onMutate: (sharedWith: string) => {
      setPendingUnshare(sharedWith);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secret', secretKey, 'shared-users'] });
    },
    onSettled: () => {
      setPendingUnshare(null);
    },
  });

  const rotateMutation = useMutation({
    mutationFn: () => secretsService.rotateSecret(secretKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secret', secretKey] });
      queryClient.invalidateQueries({ queryKey: ['secret', secretKey, 'versions'] });
      setShowRotateModal(false);
    },
  });

  const handleCopyValue = () => {
    if (secret?.value) {
      navigator.clipboard.writeText(secret.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleShare = (payload: ShareSecretPayload) => {
    shareMutation.mutate(payload);
  };

  const sensitiveValue = showValue ? secret?.value : '••••••••••••••••••••';

  const statusBadge = useMemo(() => {
    if (!secret) return null;
    const isExpired =
      secret.expired ||
      (secret.expiresAt ? new Date(secret.expiresAt).getTime() < Date.now() : false);

    if (isExpired) {
      return <Badge variant="danger">Expired</Badge>;
    }

    if (secret.expiresAt) {
      return (
        <Badge variant="warning">
          Expires {new Date(secret.expiresAt).toLocaleDateString()}
        </Badge>
      );
    }

    return <Badge variant="default">Active</Badge>;
  }, [secret]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !secret) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Failed to load secret. It may have been deleted.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate('/secrets')}
            className="mt-4"
          >
            Back to Secrets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => {
            if (isProjectScoped && projectId) {
              navigate(`/projects/${projectId}`);
            } else {
              navigate('/secrets');
            }
          }}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isProjectScoped ? 'Back to Project' : 'Back to Secrets'}
        </Button>

        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{secret.key}</h1>
              {statusBadge}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Created by {secret.createdBy || 'you'} on{' '}
              {new Date(secret.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
            {canWrite && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (isProjectScoped && projectId) {
                    navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secretKey)}/edit`);
                  } else {
                    navigate(`/secrets/${encodeURIComponent(secretKey)}/edit`);
                  }
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canRotate && (
              <Button variant="secondary" onClick={() => setShowRotateModal(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Rotate
              </Button>
            )}
            {canDelete && (
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Secret Value</h2>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setShowValue(!showValue)}>
                  {showValue ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyValue}
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-md p-4 font-mono text-sm break-all">
              {sensitiveValue}
            </div>
            {secret.expiresAt && (
              <p className="mt-3 text-xs text-gray-500">
                Secret expires {new Date(secret.expiresAt).toLocaleString()}
              </p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
              <Badge variant="info">Current v{secret.version ?? versions?.[0]?.versionNumber ?? 1}</Badge>
            </div>
            {isVersionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : versions && versions.length > 0 ? (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Version {version.versionNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {version.changedBy} • {new Date(version.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="default">
                      {version.changeDescription || 'Updated'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                No version history yet. Rotations and edits will appear here.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <span className="font-medium text-gray-900">Owner:</span> {secret.createdBy || 'Unknown'}
              </div>
              <div>
                <span className="font-medium text-gray-900">Created:</span>{' '}
                {new Date(secret.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-gray-900">Last updated:</span>{' '}
                {new Date(secret.updatedAt).toLocaleString()}
              </div>
              {secret.expiresAt && (
                <div>
                  <span className="font-medium text-gray-900">Expires:</span>{' '}
                  {new Date(secret.expiresAt).toLocaleString()}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sharing</h2>
              {canShare && (
                <Button variant="ghost" size="sm" onClick={() => setShowShareModal(true)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
            {isSharingLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : sharingError ? (
              <p className="text-sm text-red-600">
                Failed to load sharing data. Please refresh.
              </p>
            ) : sharedUsers && sharedUsers.length > 0 ? (
              <div className="space-y-4">
                {sharedUsers.map((shared) => (
                  <div key={shared.sharedWith} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{shared.sharedWith}</p>
                      <p className="text-xs text-gray-500">
                        {shared.permission} • Shared{' '}
                        {new Date(shared.sharedAt).toLocaleString()}
                      </p>
                    </div>
                    {canShare && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unshareMutation.mutate(shared.sharedWith)}
                        isLoading={pendingUnshare === shared.sharedWith && unshareMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                This secret is private. Use the share button to grant access.
              </p>
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Secret">
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{secret.key}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete Secret
            </Button>
          </div>
          {deleteMutation.isError && (
            <p className="text-sm text-red-600">Failed to delete the secret. Please try again.</p>
          )}
        </div>
      </Modal>

      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Secret" size="md">
        <form onSubmit={handleSubmit(handleShare)} className="space-y-4">
          <Input
            label="User email or username"
            placeholder="user@example.com"
            {...register('sharedWith', { required: 'User is required' })}
            error={errors.sharedWith?.message}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Permission</label>
            <select
              {...register('permission')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="READ">Read</option>
              <option value="WRITE">Write</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" type="button" onClick={() => setShowShareModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={shareMutation.isPending}>
              Share Secret
            </Button>
          </div>
          {shareMutation.isError && (
            <p className="text-sm text-red-600">
              Failed to share the secret. Ensure the user exists and try again.
            </p>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={showRotateModal}
        onClose={() => setShowRotateModal(false)}
        title="Rotate Secret"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Rotating will generate a brand new secret value and create a new version. Continue?
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowRotateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => rotateMutation.mutate()}
              isLoading={rotateMutation.isPending}
            >
              Rotate
            </Button>
          </div>
          {rotateMutation.isError && (
            <p className="text-sm text-red-600">Rotation failed. Please try again.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

