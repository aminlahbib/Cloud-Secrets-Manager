import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { useCreateWorkflow } from '../hooks/useWorkflows';
import type { CreateWorkflowRequest } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const WorkflowFormPage: React.FC = () => {
  const navigate = useNavigate();

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

  const mutation = useCreateWorkflow();

  const onSubmit = (data: CreateWorkflowRequest) => {
    mutation.mutate(data, {
      onSuccess: (workflow) => {
        navigate(`/workflows/${workflow.id}`);
      },
    });
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

        <h1 className="text-2xl font-bold text-theme-primary">Create Workflow</h1>
        <p className="text-body-sm text-theme-secondary mt-1">
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
            <label className="block text-sm font-medium mb-1 text-theme-primary">
              Description (optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe what this workflow is for..."
              className="input-theme block w-full rounded-md shadow-sm sm:text-sm"
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
          <div 
            className="border rounded-lg p-4 transition-colors duration-300"
            style={{
              backgroundColor: 'var(--status-danger-bg)',
              borderColor: 'var(--status-danger)',
            }}
          >
            <p className="text-body-sm" style={{ color: 'var(--status-danger)' }}>
              Failed to create workflow. Please try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

