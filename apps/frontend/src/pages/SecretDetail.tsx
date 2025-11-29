import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, Copy, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { secretsService } from '../services/secrets';
import { projectsService } from '../services/projects';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { queryClient } from '../main';
import type { Secret, SecretVersion, SecretVersionDetail, Project } from '../types';

export const SecretDetailPage: React.FC = () => {
  const { projectId, key: keyParam } = useParams<{ projectId: string; key: string }>();
  const secretKey = keyParam ? decodeURIComponent(keyParam) : '';
  const navigate = useNavigate();
  const [showValue, setShowValue] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionDetail, setVersionDetail] = useState<SecretVersionDetail | null>(null);
  const [showVersionValue, setShowVersionValue] = useState(false);
  const [activeVersionNumber, setActiveVersionNumber] = useState<number | null>(null);

  // Early return if secretKey is missing
  if (!secretKey || !projectId) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Invalid URL. Please navigate from a project page.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate('/home')}
            className="mt-4"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const { data: secret, isLoading, error } = useQuery<Secret>({
    queryKey: ['project-secret', projectId, secretKey],
    queryFn: () => secretsService.getProjectSecret(projectId, secretKey),
    enabled: !!secretKey && !!projectId,
  });

  const { data: versions } = useQuery<SecretVersion[]>({
    queryKey: ['project-secret-versions', projectId, secretKey],
    queryFn: () => secretsService.getProjectSecretVersions(projectId, secretKey),
    enabled: !!secretKey && !!projectId,
  });

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getProject(projectId!),
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => secretsService.deleteProjectSecret(projectId, secretKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${projectId}`);
    },
  });

  const rotateMutation = useMutation({
    mutationFn: () => secretsService.rotateProjectSecret(projectId, secretKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-secret', projectId, secretKey] });
      queryClient.invalidateQueries({ queryKey: ['project-secret-versions', projectId, secretKey] });
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const versionDetailMutation = useMutation({
    mutationFn: (versionNumber: number) =>
      secretsService.getProjectSecretVersion(projectId, secretKey, versionNumber),
    onSuccess: (data) => {
      setVersionDetail(data);
      setShowVersionModal(true);
      setShowVersionValue(false);
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: (versionNumber: number) =>
      secretsService.restoreProjectSecretVersion(projectId, secretKey, versionNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-secret', projectId, secretKey] });
      queryClient.invalidateQueries({ queryKey: ['project-secret-versions', projectId, secretKey] });
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      setShowVersionModal(false);
      setVersionDetail(null);
      setActiveVersionNumber(null);
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const openVersionModal = (versionNumber: number) => {
    setActiveVersionNumber(versionNumber);
    versionDetailMutation.mutate(versionNumber);
  };

  const closeVersionModal = () => {
    setShowVersionModal(false);
    setVersionDetail(null);
    setActiveVersionNumber(null);
  };

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
            Failed to load secret. It may have been deleted or you do not have access.
          </p>
          <Button variant="secondary" onClick={() => navigate(`/projects/${projectId}`)} className="mt-4">
            Back to Project
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = secret.expiresAt && new Date(secret.expiresAt) < new Date();
  const latestVersionNumber = versions && versions.length > 0 ? versions[0].versionNumber : secret.version || 1;
  const currentUserRole = project?.currentUserRole;
  const canRestoreVersions = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '—');

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Secret</p>
                  <h1 className="text-3xl font-semibold text-neutral-900 break-all">{secret.secretKey}</h1>
                  {secret.description && (
                    <p className="text-neutral-600 mt-2 max-w-2xl">{secret.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {isExpired && <Badge variant="danger">Expired</Badge>}
                  <Badge variant="default">v{latestVersionNumber}</Badge>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secretKey)}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => rotateMutation.mutate()}
                  isLoading={rotateMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Rotate
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (confirm('Delete this secret? This cannot be undone.')) {
                      deleteMutation.mutate();
                    }
                  }}
                  isLoading={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>

              <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-neutral-700">Value</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowValue(!showValue)}
                    >
                      {showValue ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Reveal
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToClipboard(secret.value || '')}
                      disabled={!secret.value}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showValue ? 'text' : 'password'}
                    value={secret.value || ''}
                    readOnly
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-neutral-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Created</p>
                  <p className="text-sm font-medium text-neutral-900">{formatDateTime(secret.createdAt)}</p>
                  {secret.creator && (
                    <p className="text-xs text-neutral-500 mt-1">{secret.creator.email}</p>
                  )}
                </div>
                <div className="rounded-lg border border-neutral-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Last Updated</p>
                  <p className="text-sm font-medium text-neutral-900">{formatDateTime(secret.updatedAt)}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Expires</p>
                  <p className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-neutral-900'}`}>
                    {secret.expiresAt ? formatDateTime(secret.expiresAt) : 'Not set'}
                  </p>
                </div>
                <div className="rounded-lg border border-neutral-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Your Role</p>
                  <p className="text-sm font-medium text-neutral-900">{currentUserRole || 'Member'}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Version History</h2>
                {versions && versions.length > 10 && (
                  <span className="text-xs text-neutral-500">Showing latest 10</span>
                )}
              </div>
              {versions && versions.length > 0 ? (
                <div className="space-y-2">
                  {versions.slice(0, 10).map((version) => (
                    <div
                      key={`${version.id}-${version.versionNumber}`}
                      className="rounded-lg border border-neutral-200 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">Version {version.versionNumber}</p>
                          <p className="text-xs text-neutral-500">{formatDateTime(version.createdAt)}</p>
                          {version.changeNote && (
                            <p className="text-xs text-neutral-500 mt-1 truncate">{version.changeNote}</p>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs font-medium text-neutral-700">
                          <button
                            className="hover:text-neutral-900"
                            onClick={() => openVersionModal(version.versionNumber)}
                          >
                            View
                          </button>
                          {canRestoreVersions && version.versionNumber !== latestVersionNumber && (
                            <button
                              className="hover:text-neutral-900"
                              onClick={() => openVersionModal(version.versionNumber)}
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">No version history available</p>
              )}
            </Card>
          </div>
        </div>

        <Modal
          isOpen={showVersionModal}
          onClose={closeVersionModal}
          title={`Version ${activeVersionNumber ?? ''}`}
        >
          {versionDetailMutation.isPending && (
            <div className="flex justify-center py-6">
              <Spinner size="md" />
            </div>
          )}
          {!versionDetailMutation.isPending && versionDetail && (
            <div className="space-y-4">
              <div className="text-sm text-neutral-600">
                Saved {formatDateTime(versionDetail.createdAt)}
                {versionDetail.changedBy && <span className="ml-1">by {versionDetail.changedBy}</span>}
                {versionDetail.changeNote && (
                  <p className="text-xs text-neutral-500 mt-1">{versionDetail.changeNote}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Value</label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type={showVersionValue ? 'text' : 'password'}
                      value={versionDetail.value}
                      readOnly
                      className="w-full px-3 py-2 border border-neutral-200 rounded-md bg-neutral-50 font-mono text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowVersionValue(!showVersionValue)}
                    >
                      {showVersionValue ? 'Hide' : 'Reveal'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => copyToClipboard(versionDetail.value)}>
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={closeVersionModal}>
                  Close
                </Button>
                {canRestoreVersions && versionDetail.versionNumber !== latestVersionNumber && (
                  <Button
                    variant="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeVersionNumber) {
                        restoreVersionMutation.mutate(activeVersionNumber);
                      }
                    }}
                    isLoading={restoreVersionMutation.isPending}
                  >
                    Restore Version
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};
