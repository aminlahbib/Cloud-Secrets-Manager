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
import { useI18n } from '../contexts/I18nContext';
import { updateSecretCache, updateProjectCache } from '../utils/queryInvalidation';
import type { Secret, SecretVersion, SecretVersionDetail, Project } from '../types';

export const SecretDetailPage: React.FC = () => {
  const { projectId, key: keyParam } = useParams<{ projectId: string; key: string }>();
  const secretKey = keyParam ? decodeURIComponent(keyParam) : '';
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showValue, setShowValue] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionDetail, setVersionDetail] = useState<SecretVersionDetail | null>(null);
  const [showVersionValue, setShowVersionValue] = useState(false);
  const [activeVersionNumber, setActiveVersionNumber] = useState<number | null>(null);

  // Early return if secretKey is missing
  if (!secretKey || !projectId) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div 
          className="border rounded-lg p-4"
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            borderColor: 'var(--status-danger)',
          }}
        >
          <p className="text-body-sm" style={{ color: 'var(--status-danger)' }}>
            {t('secrets.detail.invalidUrl')}
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate('/home')}
            className="mt-4"
          >
            {t('secrets.detail.backToHome')}
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['project-secrets', projectId] });
      const previous = queryClient.getQueryData(['project-secrets', projectId]);
      
      // Optimistically remove secret
      updateSecretCache(queryClient, projectId, (secrets) =>
        secrets.filter(s => s.secretKey !== secretKey)
      );
      
      // Update project secret count
      const project = queryClient.getQueryData<Project>(['project', projectId]);
      if (project) {
        updateProjectCache(queryClient, projectId, {
          secretCount: Math.max(0, (project.secretCount || 1) - 1),
        });
      }
      
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['project-secrets', projectId], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${projectId}`);
    },
  });

  const rotateMutation = useMutation({
    mutationFn: () => secretsService.rotateProjectSecret(projectId, secretKey),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['project-secret', projectId, secretKey] });
      const previous = queryClient.getQueryData(['project-secret', projectId, secretKey]);
      
      // Optimistically update version
      if (secret) {
        queryClient.setQueryData(['project-secret', projectId, secretKey], {
          ...secret,
          version: (secret.version || 1) + 1,
          updatedAt: new Date().toISOString(),
        });
      }
      
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['project-secret', projectId, secretKey], context.previous);
      }
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(['project-secret', projectId, secretKey], data);
      // Refetch versions immediately to show latest version
      queryClient.refetchQueries({ queryKey: ['project-secret-versions', projectId, secretKey] });
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
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
      // Refetch versions immediately to show latest version
      queryClient.refetchQueries({ queryKey: ['project-secret-versions', projectId, secretKey] });
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
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
        <div 
          className="border rounded-lg p-4"
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            borderColor: 'var(--status-danger)',
          }}
        >
          <p className="text-body-sm" style={{ color: 'var(--status-danger)' }}>
            {t('secrets.detail.loadError')}
          </p>
          <Button variant="secondary" onClick={() => navigate(`/projects/${projectId}`)} className="mt-4">
            {t('secrets.detail.backToProject')}
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = secret.expiresAt && new Date(secret.expiresAt) < new Date();
  // Versions are sorted DESC (newest first) from backend, so versions[0] is the latest
  // If versions array is not loaded yet or empty, fall back to finding max version number from the array
  const latestVersionNumber = versions && versions.length > 0 
    ? versions[0].versionNumber  // First element is latest (sorted DESC)
    : 1; // Default to 1 if no versions loaded yet
  const currentUserRole = project?.currentUserRole;
  const canRestoreVersions = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '—');

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('secrets.detail.backToProject')}
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-caption uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    {t('secrets.detail.secretLabel')}
                  </p>
                  <h1 className="text-h1 font-semibold break-all" style={{ color: 'var(--text-primary)' }}>{secret.secretKey}</h1>
                  {secret.description && (
                    <p className="text-body-sm mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>{secret.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {isExpired && <Badge variant="danger">{t('secrets.detail.expiredBadge')}</Badge>}
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
                  {t('secrets.detail.edit')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => rotateMutation.mutate()}
                  isLoading={rotateMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('secrets.detail.rotate')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (confirm(t('secrets.detail.deleteConfirm'))) {
                      deleteMutation.mutate();
                    }
                  }}
                  isLoading={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('secrets.detail.delete')}
                </Button>
              </div>

              <div 
                className="mt-6 rounded-xl border p-4"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--elevation-1)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t('secrets.detail.valueLabel')}
                  </p>
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
                          {t('secrets.detail.hide')}
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          {t('secrets.detail.reveal')}
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
                      {t('secrets.detail.copy')}
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showValue ? 'text' : 'password'}
                    value={secret.value || ''}
                    readOnly
                    className="input-theme w-full px-4 py-3 font-mono text-body-sm transition-colors"
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="text-caption uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                    {t('secrets.detail.created')}
                  </p>
                  <p className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDateTime(secret.createdAt)}</p>
                  {secret.creator && (
                    <p className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>{secret.creator.email}</p>
                  )}
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="text-caption uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                    {t('secrets.detail.lastUpdated')}
                  </p>
                  <p className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDateTime(secret.updatedAt)}</p>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="text-caption uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                    {t('secrets.detail.expires')}
                  </p>
                  <p className="text-body-sm font-medium" style={{ color: isExpired ? 'var(--status-danger)' : 'var(--text-primary)' }}>
                    {secret.expiresAt ? formatDateTime(secret.expiresAt) : t('secrets.detail.notSet')}
                  </p>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="text-caption uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                    {t('secrets.detail.yourRole')}
                  </p>
                  <p className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {currentUserRole || t('secrets.detail.member')}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-h3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {t('secrets.detail.versionHistory')}
                </h2>
                {versions && versions.length > 10 && (
                  <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                    {t('secrets.detail.showingLatest', { count: 10 })}
                  </span>
                )}
              </div>
              {versions && versions.length > 0 ? (
                <div className="space-y-2">
                  {versions.slice(0, 10).map((version) => (
                    <div
                      key={`${version.id}-${version.versionNumber}`}
                      className="rounded-lg border px-4 py-3"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {t('secrets.detail.versionLabel', { version: version.versionNumber })}
                          </p>
                          <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{formatDateTime(version.createdAt)}</p>
                          {version.changeNote && (
                            <p className="text-caption mt-1 truncate" style={{ color: 'var(--text-tertiary)' }}>{version.changeNote}</p>
                          )}
                        </div>
                        <div className="flex gap-3 text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>
                          <button
                            className="transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                            onClick={() => openVersionModal(version.versionNumber)}
                          >
                            View
                          </button>
                          {canRestoreVersions && version.versionNumber !== latestVersionNumber && (
                            <button
                              className="transition-colors"
                              style={{ color: 'var(--text-secondary)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--text-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
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
                <p className="text-body-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {t('secrets.detail.noVersions')}
                </p>
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
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Saved {formatDateTime(versionDetail.createdAt)}
                {versionDetail.changedBy && <span className="ml-1">by {versionDetail.changedBy}</span>}
                {versionDetail.changeNote && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{versionDetail.changeNote}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Value</label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type={showVersionValue ? 'text' : 'password'}
                      value={versionDetail.value}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm input-theme"
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
