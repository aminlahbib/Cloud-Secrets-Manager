import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { useProjects } from '../hooks/useProjects';
import { useWorkflows } from '../hooks/useWorkflows';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { FilterPanel, FilterConfig } from '../components/ui/FilterPanel';
import { useAuth } from '../contexts/AuthContext';
import type { Project, ProjectRole } from '../types';

const ROLE_COLORS: Record<ProjectRole, 'danger' | 'warning' | 'info' | 'default'> = {
  OWNER: 'danger',
  ADMIN: 'warning',
  MEMBER: 'info',
  VIEWER: 'default',
};

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth(); // For authentication check

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [projectFilters, setProjectFilters] = useState<Record<string, any>>({
    workflow: null,
    role: null,
  });

  // Fetch projects
  const { data, isLoading, error } = useProjects({
    search: searchTerm,
    includeArchived: showArchived,
  });

  // Fetch workflows to match with projects
  const { data: workflows } = useWorkflows(user?.id);

  // Enrich projects with workflow information and apply filters
  const projects = useMemo(() => {
    let projectList = data?.content ?? [];
    if (!workflows || workflows.length === 0) return projectList;

    // Enrich with workflow info
    projectList = projectList.map((project: Project) => {
      // Find which workflow contains this project
      for (const workflow of workflows) {
        if (workflow.projects?.some(wp => wp.projectId === project.id)) {
          return {
            ...project,
            workflowId: workflow.id,
            workflowName: workflow.name,
          };
        }
      }
      return project;
    });

    // Apply workflow filter
    if (projectFilters.workflow) {
      projectList = projectList.filter((project: Project) => project.workflowId === projectFilters.workflow);
    }

    return projectList;
  }, [data?.content, workflows, projectFilters.workflow]);

  const projectFilterConfigs: FilterConfig[] = useMemo(() => {
    const workflowOptions = workflows?.map(w => ({ label: w.name, value: w.id })) || [];
    return [
      {
        key: 'workflow',
        label: 'Workflow',
        type: 'select',
        options: [
          { label: 'All Workflows', value: '' },
          ...workflowOptions,
        ],
      },
    ];
  }, [workflows]);

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

  return (
    <div className="space-y-6">
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
      <div className="flex flex-col gap-4">
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
          <FilterPanel
            filters={projectFilterConfigs}
            values={projectFilters}
            onChange={(key, value) => setProjectFilters(prev => ({ ...prev, [key]: value }))}
            onClear={() => setProjectFilters({ workflow: null, role: null })}
          />
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
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <Link
              key={project.id}
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
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}
                  {project.workflowName && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <LayoutGrid className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-xs text-neutral-500 font-medium">
                        {project.workflowName}
                      </span>
                    </div>
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
          ))}

          {/* Create New Project Card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-neutral-300 rounded-xl p-6 flex flex-col items-center justify-center text-neutral-400 hover:border-neutral-900 hover:text-neutral-900 transition-colors min-h-[200px]"
          >
            <Plus className="w-12 h-12 mb-3 opacity-50" />
            <span className="font-medium">Create new project</span>
          </button>
        </div>
      )}

      {/* Pagination info */}
      {data && data.totalElements > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {projects.length} of {data.totalElements} projects
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
