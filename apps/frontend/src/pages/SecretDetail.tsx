import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Clock,
  User,
  Tag,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { secretsService } from '../services/secrets';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';

export const SecretDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showValue, setShowValue] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch secret
  const { data: secret, isLoading, error } = useQuery({
    queryKey: ['secret', id],
    queryFn: () => secretsService.getSecret(id!),
    enabled: !!id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => secretsService.deleteSecret(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      navigate('/secrets');
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
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/secrets')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Secrets
        </Button>

        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{secret.key}</h1>
            {secret.description && (
              <p className="mt-2 text-sm text-gray-700">{secret.description}</p>
            )}
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => navigate(`/secrets/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Secret Value */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Secret Value</h2>
              <div className="flex space-x-2">
                <Button
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
              {showValue ? secret.value : '••••••••••••••••••••'}
            </div>
          </Card>

          {/* Tags */}
          {secret.tags && secret.tags.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {secret.tags.map((tag) => (
                  <Badge key={tag} variant="info">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Version History */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Version History
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Version</span>
                <span className="font-medium">v{secret.version || 1}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">
                  {new Date(secret.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Clock className="h-4 w-4 mr-2" />
                  Created
                </div>
                <p className="text-sm font-medium pl-6">
                  {new Date(secret.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <User className="h-4 w-4 mr-2" />
                  Owner
                </div>
                <p className="text-sm font-medium pl-6">
                  {secret.createdBy || 'You'}
                </p>
              </div>

              {secret.expiresAt && (
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Clock className="h-4 w-4 mr-2" />
                    Expires
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {new Date(secret.expiresAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Sharing */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sharing</h2>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              This secret is private. Click "Share" to give others access.
            </p>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Secret"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{secret.key}</strong>? This
            action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
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
        </div>
      </Modal>
    </div>
  );
};

