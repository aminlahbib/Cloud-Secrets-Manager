import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { secretsService, type SecretRequest } from '../services/secrets';
import type { CreateSecretRequest } from '../types';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

type SecretFormValues = SecretRequest & {
  description?: string;
  expiresAt?: string;
};

const toInputValue = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const toApiValue = (value?: string) => {
  if (!value) return undefined;
  return value.length === 16 ? `${value}:00` : value;
};

export const SecretFormPage: React.FC = () => {
  const { key: keyParam, projectId } = useParams<{ key: string; projectId?: string }>();
  const secretKey = keyParam ? decodeURIComponent(keyParam) : '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!secretKey;
  const isProjectScoped = !!projectId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SecretFormValues>({
    defaultValues: {
      key: '',
      value: '',
      expiresAt: '',
    },
  });

  const { data: secret, isLoading } = useQuery({
    queryKey: isProjectScoped ? ['project-secret', projectId, secretKey] : ['secret', secretKey],
    queryFn: () => isProjectScoped && projectId 
      ? secretsService.getProjectSecret(projectId, secretKey)
      : secretsService.getSecret(secretKey),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (secret) {
      setValue('key', secret.key || secret.secretKey || '');
      setValue('value', secret.value || '');
      setValue('expiresAt', toInputValue(secret.expiresAt));
    }
  }, [secret, setValue]);

  const mutation = useMutation({
    mutationFn: async (payload: SecretFormValues) => {
      const { key, value, expiresAt } = payload;
      
      let result: any;
      
      if (isProjectScoped && projectId) {
        // Use project-scoped endpoints
        // Backend expects 'key' not 'secretKey' for SecretRequest
        const request: CreateSecretRequest = { secretKey: key, value, description: payload.description };
        result = isEditMode
          ? await secretsService.updateProjectSecret(projectId, secretKey, { value, description: payload.description })
          : await secretsService.createProjectSecret(projectId, request);
      } else {
        // Use legacy endpoints
        const baseRequest: SecretRequest = { key, value };
        result = isEditMode
          ? await secretsService.updateSecret(secretKey, baseRequest)
          : await secretsService.createSecret(baseRequest);
      }

      const targetKey = result.key || result.secretKey || key;
      const formattedExpiration = toApiValue(expiresAt);

      // Note: Expiration setting may need project-scoped endpoint too
      if (formattedExpiration && !isProjectScoped) {
        await secretsService.setExpiration(targetKey, formattedExpiration);
      } else if (isEditMode && secret?.expiresAt && !isProjectScoped) {
        await secretsService.removeExpiration(targetKey);
      }

      return result;
    },
    onSuccess: (data) => {
      const targetKey = data.key || data.secretKey || '';
      
      if (isProjectScoped && projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
        queryClient.invalidateQueries({ queryKey: ['project-secret', projectId, targetKey] });
        navigate(`/projects/${projectId}/secrets/${encodeURIComponent(targetKey)}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['secrets'] });
        queryClient.invalidateQueries({ queryKey: ['secret', targetKey] });
        navigate(`/secrets/${encodeURIComponent(targetKey)}`);
      }
    },
  });

  const onSubmit = (data: SecretFormValues) => {
    mutation.mutate(data);
  };

  if (isEditMode && isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
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
              navigate(isEditMode 
                ? `/projects/${projectId}/secrets/${encodeURIComponent(secretKey)}` 
                : `/projects/${projectId}`);
            } else {
              navigate(isEditMode ? `/secrets/${encodeURIComponent(secretKey)}` : '/secrets');
            }
          }}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Secret' : 'Create Secret'}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          {isEditMode
            ? 'Update the sensitive value and lifecycle for this secret'
            : 'Add a new encrypted secret to your vault'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <Input
              label="Secret Key"
              placeholder="e.g., database.password"
              error={errors.key?.message}
              required
              disabled={isEditMode}
              {...register('key', {
                required: 'Secret key is required',
                maxLength: {
                  value: 255,
                  message: 'Key must be 255 characters or fewer',
                },
              })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Value <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('value', {
                  required: 'Secret value is required',
                  maxLength: {
                    value: 5000,
                    message: 'Value must be 5000 characters or fewer',
                  },
                })}
                rows={4}
                placeholder="Enter the secret value..."
                className={`block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.value
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                }`}
              />
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Lifecycle</h2>
            <p className="text-sm text-gray-600 mb-4">
              Optionally set an expiration to automatically mark this secret as expired.
            </p>
            <Input
              label="Expiration Date (optional)"
              type="datetime-local"
              helperText="Leave blank to keep the secret active indefinitely."
              {...register('expiresAt')}
            />
          </div>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (isProjectScoped && projectId) {
                navigate(isEditMode 
                  ? `/projects/${projectId}/secrets/${encodeURIComponent(secretKey)}` 
                  : `/projects/${projectId}`);
              } else {
                navigate(isEditMode ? `/secrets/${encodeURIComponent(secretKey)}` : '/secrets');
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isEditMode ? 'Update Secret' : 'Create Secret'}
          </Button>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Failed to {isEditMode ? 'update' : 'create'} the secret. Please try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

