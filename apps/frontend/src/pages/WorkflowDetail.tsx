import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Folder, Plus } from 'lucide-react';
import { workflowsService } from '../services/workflows';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import type { Workflow } from '../types';

export const WorkflowDetailPage: React.FC = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const { data: workflow, isLoading, error } = useQuery<Workflow>({
    queryKey: ['workflow', workflowId],
    queryFn: () => workflowsService.getWorkflow(workflowId!),
    enabled: !!workflowId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Workflow Not Found</h2>
          <p className="text-sm text-red-700 mb-4">
            This workflow may have been deleted or you don't have access to it.
          </p>
          <Button variant="secondary" onClick={() => navigate('/home')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const projects = workflow.projects || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/home')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{workflow.name}</h1>
            {workflow.description && (
              <p className="mt-1 text-neutral-500">{workflow.description}</p>
            )}
            {workflow.isDefault && (
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 rounded-full">
                Default Workflow
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-2xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              Projects ({projects.length})
            </h2>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Folder className="h-16 w-16 text-neutral-300" />}
              title="No projects in this workflow"
              description="Create a new project and add it to this workflow"
              action={{
                label: 'Create Project',
                onClick: () => setShowCreateModal(true),
              }}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {projects.map((wp) => (
              <Link
                key={wp.projectId}
                to={`/projects/${wp.projectId}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neutral-100 rounded-lg text-neutral-600">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {wp.project?.name || 'Project'}
                    </h3>
                    {wp.project?.description && (
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {wp.project.description}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    Added {wp.addedAt ? new Date(wp.addedAt).toLocaleDateString() : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialWorkflowId={workflowId}
      />
    </div>
  );
};

