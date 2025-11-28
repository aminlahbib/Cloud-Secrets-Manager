import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Folder,
  Plus,
  Search,
  Users,
  Key,
  Archive,
  Crown,
  Shield,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useWorkflows } from '../hooks/useWorkflows';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import type { Project, ProjectRole, Workflow } from '../types';

const ROLE_COLORS: Record<ProjectRole, 'danger' | 'warning' | 'info' | 'default'> = {
  OWNER: 'danger',
  ADMIN: 'warning',
  MEMBER: 'info',
  VIEWER: 'default',
};

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

  // Fetch projects
  const { data: projectsData, isLoading: isProjectsLoading, error: projectsError } = useProjects({
    search: searchTerm,
    includeArchived: showArchived,
  });

  // Fetch workflows
  const { data: workflows, isLoading: isWorkflowsLoading } = useWorkflows(user?.id);

  // Create project mutation
  const createMutation = useCreateProject();

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        name: newProjectName,
        description: newProjectDescription || undefined,
        workflowId: selectedWorkflowId || undefined,
      },
      {
        onSuccess: (project) => {
          setShowCreateModal(false);
          setNewProjectName('');
          setNewProjectDescription('');
          setSelectedWorkflowId('');
          navigate(`/projects/${project.id}`);
        },
      }
    );
  };

  const projects = projectsData?.content ?? [];

  // Group projects by workflow
  const groupedProjects = useMemo(() => {
    if (!projects || !workflows) return { unassigned: projects, groups: [] };

    const workflowMap = new Map<string, Project[]>();
    const unassigned: Project[] = [];

    // Initialize map with empty arrays for all workflows to ensure they show up
    workflows.forEach(w => workflowMap.set(w.id, []));

    // Helper to find which workflow a project belongs to
    // Since Project entity doesn't strictly have workflowId on it in the frontend type yet (maybe),
    // we might need to rely on the workflow's project list if available, OR assume the backend returns it.
    // However, the Workflow type has `projects: WorkflowProject[]`.
    // So we iterate workflows and their projects to build the map.

    const projectWorkflowIdMap = new Map<string, string>();
    workflows.forEach(w => {
      w.projects?.forEach(wp => {
        projectWorkflowIdMap.set(wp.projectId, w.id);
      });
    });

    projects.forEach(p => {
      const wId = projectWorkflowIdMap.get(p.id);
      if (wId && workflowMap.has(wId)) {
        workflowMap.get(wId)?.push(p);
      } else {
        unassigned.push(p);
      }
    });

    return {
      unassigned,
      groups: workflows.map(w => ({
        workflow: w,
        projects: workflowMap.get(w.id) || []
      }))
    };
  }, [projects, workflows]);

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <Link
      to={`/projects/${project.id}`}
      className="block group"
    >
      <div className={`
        bg-white rounded-xl p-6 shadow-sm border transition-all h-full flex flex-col
        ${project.isArchived
          ? 'border-gray-200 opacity-75'
          : 'border-neutral-200 hover:shadow-md hover:border-neutral-900'
        }
      `}>
        <div className="flex justify-between items-start mb-4">
          <div className={`
            p-3 rounded-lg transition-colors
            ${project.isArchived
              ? 'bg-gray-100'
              : 'bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition-colors'
            }
          `}>
            {project.isArchived ? (
              <Archive className="w-8 h-8 text-gray-400" />
            ) : (
              <Folder className="w-8 h-8" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {project.currentUserRole && (
              <Badge variant={ROLE_COLORS[project.currentUserRole]}>
                {project.currentUserRole === 'OWNER' && <Crown className="h-3 w-3 mr-1" />}
                {project.currentUserRole === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                {project.currentUserRole}
              </Badge>
            )}
            {project.isArchived && (
              <Badge variant="warning">Archived</Badge>
            )}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-neutral-900">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-gray-500 text-sm line-clamp-2 mb-4">
              {project.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-400">
            <span className="flex items-center" title="Secrets">
              <Key className="h-4 w-4 mr-1" />
              {project.secretCount ?? 0}
            </span>
            <span className="flex items-center" title="Members">
              <Users className="h-4 w-4 mr-1" />
              {project.memberCount ?? 1}
            </span>
          </div>
          <span className="flex items-center text-gray-400" title="Last updated">
            <Clock className="h-4 w-4 mr-1" />
            {getTimeAgo(project.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage your projects and secret collections</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
          />
        </div>
        <label className="flex items-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-neutral-300 text-neutral-600 focus:ring-neutral-500"
          />
          <span>Show archived</span>
        </label>
      </div>

      {/* Content */}
      {isProjectsLoading || isWorkflowsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projectsError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">Failed to load projects. Please try again.</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<Folder className="h-16 w-16 text-gray-400" />}
          title={searchTerm ? 'No projects match your search' : 'No projects yet'}
          description={
            searchTerm
              ? 'Try a different search term'
              : 'Create your first project to start managing secrets'
          }
          action={{
            label: 'Create Project',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="space-y-10">
          {/* Workflows Groups */}
          {groupedProjects.groups.map(({ workflow, projects }) => (
            <div key={workflow.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <LayoutGrid className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">{workflow.name}</h2>
                <span className="text-sm text-gray-500">({projects.length})</span>
              </div>
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic py-4">
                  No projects in this workflow
                </div>
              )}
            </div>
          ))}

          {/* Unassigned Projects */}
          {groupedProjects.unassigned.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Folder className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Unassigned Projects</h2>
                <span className="text-sm text-gray-500">({groupedProjects.unassigned.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedProjects.unassigned.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination info */}
      {projectsData && projectsData.totalElements > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {projects.length} of {projectsData.totalElements} projects
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
      >
        <form
          onSubmit={handleCreateProject}
          className="space-y-4"
        >
          <Input
            label="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="e.g., Backend Services"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              placeholder="Brief description of this project..."
              rows={3}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workflow (optional)
            </label>
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
            >
              <option value="">No Workflow (Unassigned)</option>
              {workflows?.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Group this project under a specific workflow for better organization.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={!newProjectName.trim()}
            >
              Create Project
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">
              Failed to create project. Please try again.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
};
