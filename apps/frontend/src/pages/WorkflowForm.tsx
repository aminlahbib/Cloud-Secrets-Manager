import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { workflowsService } from '../services/workflows';
import type { CreateWorkflowRequest } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const WorkflowFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkflowRequest>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (request: CreateWorkflowRequest) => workflowsService.createWorkflow(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      navigate('/home');
    },
  });

  const onSubmit = (data: CreateWorkflowRequest) => {
    mutation.mutate(data);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/home')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-gray-900">Create Workflow</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create a new workflow to organize your projects
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        <Card className="p-6 space-y-6">
          <Input
            label="Workflow Name"
            placeholder="e.g., Personal, Work, Side Projects"
            error={errors.name?.message}
            required
            {...register('name', {
              required: 'Workflow name is required',
              maxLength: {
                value: 100,
                message: 'Name must be 100 characters or fewer',
              },
            })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe what this workflow is for..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/home')}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Failed to create workflow. Please try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

