import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useProjectSecret, useSaveSecret } from '../hooks/useSecrets';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import type { SecretFormValues } from '../types';

export const SecretFormPage: React.FC = () => {
  const { projectId, key: keyParam } = useParams<{ projectId: string; key: string }>();
  const secretKey = keyParam ? decodeURIComponent(keyParam) : '';
  const navigate = useNavigate();
  const isEditMode = !!secretKey;
  const isProjectScoped = !!projectId;

  // Redirect if not in project context
  useEffect(() => {
    if (!isProjectScoped) {
      navigate('/home');
    }
  }, [isProjectScoped, navigate]);

  // Fetch existing secret for editing
  const { data: existingSecret, isLoading } = useProjectSecret(projectId!, secretKey, isEditMode && !!projectId);

  const mutation = useSaveSecret(projectId!, isEditMode);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: SecretFormValues = {
      key: formData.get('key') as string,
      value: formData.get('value') as string,
      description: (formData.get('description') as string) || '', // Send empty string if empty
      expiresAt: formData.get('expiresAt') ? new Date(formData.get('expiresAt') as string) : undefined,
    };

    if (isEditMode) {
      payload.key = secretKey;
    }

    if (!payload.key || !payload.value) {
      alert('Key and value are required');
      return;
    }

    mutation.mutate(payload, {
      onSuccess: (result) => {
        const targetKey = result.key || result.secretKey || payload.key;
        navigate(`/projects/${projectId}/secrets/${encodeURIComponent(targetKey)}`);
      }
    });
  };

  if (!isProjectScoped) {
    return null; // Will redirect
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </button>

        <div className="bg-white border border-neutral-200 rounded-[24px] shadow-sm p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">
              {isEditMode ? 'Edit Secret' : 'Create New Secret'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-neutral-800 mb-2">
                Secret Key *
              </label>
              <Input
                id="key"
                name="key"
                defaultValue={isEditMode ? secretKey : ''}
                placeholder="e.g., API_KEY, DB_PASSWORD"
                disabled={isEditMode}
                required={!isEditMode}
              />
              {isEditMode && (
                <p className="text-sm text-gray-500 mt-1">Key cannot be changed when editing</p>
              )}
            </div>

            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                Secret Value *
              </label>
              <Textarea
                id="value"
                name="value"
                defaultValue={existingSecret?.value || ''}
                placeholder="Enter the secret value"
                rows={4}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-800 mb-2">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                name="description"
                defaultValue={existingSecret?.description || ''}
                placeholder="Describe what this secret is used for"
                rows={2}
              />
            </div>

            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-neutral-800 mb-2">
                Expires At (Optional)
              </label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                defaultValue={existingSecret?.expiresAt ? new Date(existingSecret.expiresAt).toISOString().slice(0, 16) : ''}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/projects/${projectId}`)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="px-6">
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Secret' : 'Create Secret'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
