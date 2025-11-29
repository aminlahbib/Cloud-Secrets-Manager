import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Folder, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useWorkflow, useUpdateWorkflow, useDeleteWorkflow } from '../hooks/useWorkflows';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const WorkflowDetailPage: React.FC = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { data: workflow, isLoading, error } = useWorkflow(workflowId);
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  // Initialize edit form when workflow loads or editing starts
  React.useEffect(() => {
    if (workflow && isEditing) {
      setEditName(workflow.name);
      setEditDescription(workflow.description || '');
    }
  }, [workflow, isEditing]);

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
        <div 
          className="border rounded-lg p-6 transition-colors duration-300"
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            borderColor: 'var(--status-danger)',
          }}
        >
          <h2 className="text-h3 font-semibold mb-2" style={{ color: 'var(--status-danger)' }}>Workflow Not Found</h2>
          <p className="text-body-sm mb-4" style={{ color: 'var(--status-danger)' }}>
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
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Workflow name"
                  className="text-2xl font-bold"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="input-theme w-full px-4 py-2 rounded-lg"
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      updateWorkflow.mutate(
                        {
                          id: workflowId!,
                          data: { name: editName, description: editDescription || undefined },
                        },
                        {
                          onSuccess: () => {
                            setIsEditing(false);
                          },
                        }
                      );
                    }}
                    isLoading={updateWorkflow.isPending}
                    disabled={!editName.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(workflow.name);
                      setEditDescription(workflow.description || '');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>{workflow.name}</h1>
                {workflow.description && (
                  <p className="mt-1 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>{workflow.description}</p>
                )}
                {workflow.isDefault && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full transition-colors duration-300" style={{ color: 'var(--tab-text-muted)', backgroundColor: 'var(--tab-hover-bg)' }}>
                    Default Workflow
                  </span>
                )}
              </>
            )}
          </div>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {!workflow.isDefault && (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="card rounded-2xl">
        <div className="p-6 border-b transition-colors duration-300" style={{ borderColor: 'var(--tab-border)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
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
              icon={<Folder className="h-16 w-16" style={{ color: 'var(--text-tertiary)' }} />}
              title="No projects in this workflow"
              description="Create a new project and add it to this workflow"
              action={{
                label: 'Create Project',
                onClick: () => setShowCreateModal(true),
              }}
            />
          </div>
        ) : (
          <div className="divide-y transition-colors duration-300" style={{ borderColor: 'var(--table-divider)' }}>
            {projects.map((wp) => (
              <Link
                key={wp.projectId}
                to={`/projects/${wp.projectId}`}
                className="block p-6 transition-colors duration-300"
                style={{
                  '--hover-bg': 'var(--tab-hover-bg)',
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--tab-hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--tab-hover-bg)', color: 'var(--tab-text-muted)' }}>
                    <Folder className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                      {wp.project?.name || 'Project'}
                    </h3>
                    {wp.project?.description && (
                      <p className="mt-1 text-sm truncate transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                        {wp.project.description}
                      </p>
                    )}
                  </div>
                  <div className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Workflow"
      >
        <div className="space-y-4">
          <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
            Are you sure you want to delete <strong>{workflow.name}</strong>?
          </p>
          <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
            This will remove the workflow, but projects in this workflow will not be deleted. 
            They will become unassigned and can be moved to other workflows.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteWorkflow.mutate(workflowId!, {
                  onSuccess: () => {
                    navigate('/home');
                  },
                });
              }}
              isLoading={deleteWorkflow.isPending}
            >
              Delete Workflow
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

