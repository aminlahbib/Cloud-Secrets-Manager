import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, Copy, Eye, EyeOff, RotateCcw, Clock } from 'lucide-react';
import { secretsService } from '../services/secrets';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { queryClient } from '../main';
import type { Secret, SecretVersion } from '../types';

export const SecretDetailPage: React.FC = () => {
  const { projectId, key: keyParam } = useParams<{ projectId: string; key: string }>();
  const secretKey = keyParam ? decodeURIComponent(keyParam) : '';
  const navigate = useNavigate();
  const [showValue, setShowValue] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: () => secretsService.deleteProjectSecret(projectId, secretKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
      navigate(`/projects/${projectId}`);
    },
  });

  const rotateMutation = useMutation({
    mutationFn: () => secretsService.rotateProjectSecret(projectId, secretKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-secret', projectId, secretKey] });
      queryClient.invalidateQueries({ queryKey: ['project-secret-versions', projectId, secretKey] });
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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>

        <div className="flex space-x-2">
              <Button
                variant="secondary"
            onClick={() => navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secretKey)}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
          <Button
            variant="secondary"
            onClick={() => rotateMutation.mutate()}
            disabled={rotateMutation.isPending}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${rotateMutation.isPending ? 'animate-spin' : ''}`} />
                Rotate
              </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Are you sure you want to delete this secret? This action cannot be undone.')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Secret Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{secret.secretKey}</h1>
              <div className="flex space-x-2">
                {isExpired && <Badge variant="danger">Expired</Badge>}
                <Badge variant="default">v{secret.version || 1}</Badge>
              </div>
            </div>

            {secret.description && (
              <p className="text-gray-600 mb-4">{secret.description}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type={showValue ? 'text' : 'password'}
                      value={secret.value || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowValue(!showValue)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => copyToClipboard(secret.value || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
        </div>
              </div>

              {secret.expiresAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expires At
                  </label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className={isExpired ? 'text-red-600' : 'text-gray-900'}>
                  {new Date(secret.expiresAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                Created {new Date(secret.createdAt).toLocaleString()}
                {secret.creator && ` by ${secret.creator.email}`}
              </div>
            </div>
          </Card>
        </div>

        {/* Version History */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Version History</h2>
            {versions && versions.length > 0 ? (
              <div className="space-y-3">
                {versions.slice(0, 10).map((version) => (
                  <div key={version.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium">Version {version.versionNumber}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(version.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {version.changeNote && (
                      <div className="text-sm text-gray-600 max-w-32 truncate">
                        {version.changeNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No version history available</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
