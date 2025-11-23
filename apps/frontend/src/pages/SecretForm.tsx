import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, X } from 'lucide-react';
import { secretsService, type SecretRequest } from '../services/secrets';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';

export const SecretFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [activeTab, setActiveTab] = useState('basic');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SecretRequest>();

  // Fetch secret if editing
  const { data: secret, isLoading } = useQuery({
    queryKey: ['secret', id],
    queryFn: () => secretsService.getSecret(id!),
    enabled: isEditMode,
    onSuccess: (data) => {
      setValue('key', data.key);
      setValue('value', data.value);
      setValue('description', data.description || '');
      setValue('tags', data.tags || []);
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: SecretRequest) =>
      isEditMode
        ? secretsService.updateSecret(id!, data)
        : secretsService.createSecret(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      queryClient.invalidateQueries({ queryKey: ['secret', data.id] });
      navigate(isEditMode ? `/secrets/${id}` : '/secrets');
    },
  });

  const onSubmit = (data: SecretRequest) => {
    mutation.mutate(data);
  };

  if (isEditMode && isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const tags = watch('tags') || [];

  const tabs = [
    {
      id: 'basic',
      label: 'Basic Information',
      content: (
        <div className="space-y-4">
          <Input
            label="Secret Key"
            placeholder="e.g., database.password"
            error={errors.key?.message}
            required
            disabled={isEditMode}
            {...register('key', { required: 'Secret key is required' })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret Value <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('value', { required: 'Secret value is required' })}
              rows={4}
              placeholder="Enter the secret value..."
              className={`
                block w-full rounded-md shadow-sm sm:text-sm
                ${
                  errors.value
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                }
              `}
            />
            {errors.value && (
              <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Optional description..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'advanced',
      label: 'Advanced Settings',
      content: (
        <div className="space-y-4">
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const newTags = tags.filter((_: any, i: number) => i !== index);
                      setValue('tags', newTags);
                    }}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                id="tagInput"
                placeholder="Add a tag..."
                className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    const newTag = input.value.trim();
                    if (newTag && !tags.includes(newTag)) {
                      setValue('tags', [...tags, newTag]);
                      input.value = '';
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const input = document.getElementById('tagInput') as HTMLInputElement;
                  const newTag = input.value.trim();
                  if (newTag && !tags.includes(newTag)) {
                    setValue('tags', [...tags, newTag]);
                    input.value = '';
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Expiration */}
          <Input
            label="Expiration Date (Optional)"
            type="datetime-local"
            {...register('expiresAt')}
          />
        </div>
      ),
    },
    {
      id: 'sharing',
      label: 'Sharing',
      content: (
        <Card className="p-6 bg-gray-50">
          <p className="text-sm text-gray-600">
            Sharing settings will be available after creating the secret. You can
            share this secret with other users from the detail page.
          </p>
        </Card>
      ),
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(isEditMode ? `/secrets/${id}` : '/secrets')}
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
            ? 'Update your secret information'
            : 'Add a new encrypted secret to your vault'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <Card className="p-6 mb-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEditMode ? `/secrets/${id}` : '/secrets')}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isEditMode ? 'Update Secret' : 'Create Secret'}
          </Button>
        </div>

        {/* Error Message */}
        {mutation.isError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Failed to {isEditMode ? 'update' : 'create'} secret. Please try
              again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

