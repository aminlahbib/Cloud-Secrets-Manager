import React, { useState, useMemo } from 'react';
import { useDebounce } from '../utils/debounce';
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
  LayoutGrid,
  List
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useWorkflows } from '../hooks/useWorkflows';
import { usePreferences } from '../hooks/usePreferences';
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
  const { projectView, setProjectView } = usePreferences();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [projectFilters, setProjectFilters] = useState<Record<string, any>>({
    workflow: null,
    role: null,
  });

  // Fetch projects
  const { data, isLoading, error } = useProjects({
    search: debouncedSearchTerm,
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">Manage your projects and secret collections</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] rounded-lg">
            <button
              onClick={() => setProjectView('grid')}
              className={`p-2 rounded transition-all duration-300 ${
                projectView === 'grid'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setProjectView('list')}
              className={`p-2 rounded transition-all duration-300 ${
                projectView === 'list'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 dark:text-neutral-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-[rgba(255,255,255,0.05)] rounded-lg focus:ring-2 focus:ring-neutral-900 dark:focus:ring-orange-500 focus:border-neutral-900 dark:focus:border-orange-500/30 bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white transition-colors"
            />
          </div>
          <FilterPanel
            filters={projectFilterConfigs}
            values={projectFilters}
            onChange={(key, value) => setProjectFilters(prev => ({ ...prev, [key]: value }))}
            onClear={() => setProjectFilters({ workflow: null, role: null })}
          />
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-neutral-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 focus:ring-neutral-500 dark:focus:ring-neutral-400"
            />
            <span>Show archived</span>
          </label>
        </div>
      </div>

      {/* Projects Grid/List */}
      {isLoading ? (
        <div className={projectView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-300">Failed to load projects. Please try again.</p>
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
      ) : projectView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block group"
            >
              <div className={`
                bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-sm border transition-all h-full flex flex-col
                ${project.isArchived
                  ? 'border-gray-200 dark:border-[rgba(255,255,255,0.05)] opacity-75'
                  : 'border-neutral-200 dark:border-[rgba(255,255,255,0.05)] hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.4)] hover:border-orange-300 dark:hover:border-orange-500/30'
                }
              `}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`
                    p-3 rounded-lg transition-colors
                    ${project.isArchived
                      ? 'bg-gray-100 dark:bg-neutral-800'
                      : 'bg-neutral-100 dark:bg-neutral-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors'
                    }
                  `}>
                    {project.isArchived ? (
                      <Archive className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
                    ) : (
                      <Folder className="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
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
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-gray-500 dark:text-neutral-400 text-sm line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}
                  {project.workflowName && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <LayoutGrid className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        {project.workflowName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[rgba(255,255,255,0.05)] flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-400 dark:text-neutral-500">
                    <span className="flex items-center" title="Secrets">
                      <Key className="h-4 w-4 mr-1" />
                      {project.secretCount ?? 0}
                    </span>
                    <span className="flex items-center" title="Members">
                      <Users className="h-4 w-4 mr-1" />
                      {project.memberCount ?? 1}
                    </span>
                  </div>
                  <span className="flex items-center text-gray-400 dark:text-neutral-500" title="Last updated">
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
            className="border-2 border-dashed border-neutral-300 dark:border-[rgba(255,255,255,0.05)] rounded-xl p-6 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 hover:border-orange-300 dark:hover:border-orange-500/30 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-300 min-h-[200px] bg-white dark:bg-[#1a1a1a]"
          >
            <Plus className="w-12 h-12 mb-3 opacity-50" />
            <span className="font-medium">Create new project</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project: Project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block group"
            >
              <div className={`
                bg-white dark:bg-[#1a1a1a] rounded-xl p-4 shadow-sm border transition-all flex items-center gap-4
                ${project.isArchived
                  ? 'border-gray-200 dark:border-[rgba(255,255,255,0.05)] opacity-75'
                  : 'border-neutral-200 dark:border-[rgba(255,255,255,0.05)] hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.4)] hover:border-orange-300 dark:hover:border-orange-500/30'
                }
              `}>
                <div className={`
                  p-3 rounded-lg transition-colors flex-shrink-0
                  ${project.isArchived
                    ? 'bg-gray-100 dark:bg-neutral-800'
                    : 'bg-neutral-100 dark:bg-neutral-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                  }
                `}>
                  {project.isArchived ? (
                    <Archive className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
                  ) : (
                    <Folder className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
                      {project.name}
                    </h3>
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
                  {project.description && (
                    <p className="text-gray-500 dark:text-neutral-400 text-sm line-clamp-1 mb-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-neutral-500">
                    {project.workflowName && (
                      <div className="flex items-center gap-1.5">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{project.workflowName}</span>
                      </div>
                    )}
                    <span className="flex items-center">
                      <Key className="h-4 w-4 mr-1" />
                      {project.secretCount ?? 0} secrets
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {project.memberCount ?? 1} members
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {getTimeAgo(project.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Create New Project Card (List View) */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full border-2 border-dashed border-neutral-300 dark:border-[rgba(255,255,255,0.05)] rounded-xl p-6 flex items-center justify-center gap-3 text-neutral-400 dark:text-neutral-500 hover:border-orange-300 dark:hover:border-orange-500/30 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-300 bg-white dark:bg-[#1a1a1a]"
          >
            <Plus className="w-6 h-6 opacity-50" />
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
