import React, { useState, useMemo } from 'react';
import { useDebounce } from '../utils/debounce';
import {
  Folder,
  Plus,
  Search,
  LayoutGrid,
  List,
  Building2,
  Layers
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useProjects } from '../hooks/useProjects';
import { useWorkflows } from '../hooks/useWorkflows';
import { usePreferences } from '../hooks/usePreferences';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { FilterPanel, FilterConfig } from '../components/ui/FilterPanel';
import { TeamsVsDirectGuidance } from '../components/projects/TeamsVsDirectGuidance';
import { ProjectCard } from '../components/projects/ProjectCard';
import { useAuth } from '../contexts/AuthContext';
import type { Project, ProjectTeamInfo } from '../types';

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
    team: null,
    accessSource: null, // 'DIRECT', 'TEAM', 'BOTH', or null for all
  });
  const [groupBy, setGroupBy] = useState<'none' | 'team' | 'workflow'>('none');

  // Fetch projects
  const { data, isLoading, error } = useProjects({
    search: debouncedSearchTerm,
    includeArchived: showArchived,
  });

  // Fetch workflows to match with projects
  const { data: workflows } = useWorkflows(user?.id);
  
  // Fetch teams for filtering
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => import('../services/teams').then(m => m.teamsService.listTeams()),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Enrich projects with workflow information and apply filters
  const { filteredProjects, groupedProjects } = useMemo(() => {
    let projectList = data?.content ?? [];
    if (!workflows || workflows.length === 0) {
      return { filteredProjects: projectList, groupedProjects: null };
    }

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
    
    // Apply team filter
    if (projectFilters.team) {
      projectList = projectList.filter((project: Project) => 
        project.teams?.some((team: ProjectTeamInfo) => team.teamId === projectFilters.team)
      );
    }
    
    // Apply access source filter
    if (projectFilters.accessSource) {
      projectList = projectList.filter((project: Project) => 
        project.accessSource === projectFilters.accessSource
      );
    }

    // Group projects if groupBy is set
    let grouped: Record<string, Project[]> | null = null;
    if (groupBy === 'team' && teams && teams.length > 0) {
      grouped = {};
      // Add projects to their teams
      projectList.forEach((project) => {
        if (project.teams && project.teams.length > 0) {
          project.teams.forEach((team: ProjectTeamInfo) => {
            if (!grouped![team.teamName]) {
              grouped![team.teamName] = [];
            }
            // Avoid duplicates
            if (!grouped![team.teamName].some(p => p.id === project.id)) {
              grouped![team.teamName].push(project);
            }
          });
        } else {
          // Projects without teams go to "No Team"
          if (!grouped!['No Team']) {
            grouped!['No Team'] = [];
          }
          grouped!['No Team'].push(project);
        }
      });
    } else if (groupBy === 'workflow' && workflows && workflows.length > 0) {
      grouped = {};
      // Add projects to their workflows
      projectList.forEach((project) => {
        const workflowName = project.workflowName || 'No Workflow';
        if (!grouped![workflowName]) {
          grouped![workflowName] = [];
        }
        grouped![workflowName].push(project);
      });
    }

    return { filteredProjects: projectList, groupedProjects: grouped };
  }, [data?.content, workflows, teams, projectFilters.workflow, projectFilters.team, projectFilters.accessSource, groupBy]);
  
  const projects = filteredProjects;

  const projectFilterConfigs: FilterConfig[] = useMemo(() => {
    const workflowOptions = workflows?.map(w => ({ label: w.name, value: w.id })) || [];
    const teamOptions = teams?.map(t => ({ label: t.name, value: t.id })) || [];
    
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
      {
        key: 'team',
        label: 'Team',
        type: 'select',
        options: [
          { label: 'All Teams', value: '' },
          ...teamOptions,
        ],
      },
      {
        key: 'accessSource',
        label: 'Access Source',
        type: 'select',
        options: [
          { label: 'All Access', value: '' },
          { label: 'Direct Access', value: 'DIRECT' },
          { label: 'Team Access', value: 'TEAM' },
          { label: 'Both', value: 'BOTH' },
        ],
      },
    ];
  }, [workflows, teams]);

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-h1 text-primary">Projects</h1>
            <p className="text-body-sm text-secondary mt-1">Manage your projects and secret collections</p>
          </div>
          <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 border rounded-lg dropdown-glass" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => setProjectView('grid')}
              className="p-2 rounded transition-all duration-150 border"
              style={{
                backgroundColor: projectView === 'grid' ? 'var(--accent-primary-glow)' : 'transparent',
                borderColor: projectView === 'grid' ? 'var(--accent-primary)' : 'transparent',
                color: projectView === 'grid' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (projectView !== 'grid') {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (projectView !== 'grid') {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setProjectView('list')}
              className="p-2 rounded transition-all duration-150 border"
              style={{
                backgroundColor: projectView === 'list' ? 'var(--accent-primary-glow)' : 'transparent',
                borderColor: projectView === 'list' ? 'var(--accent-primary)' : 'transparent',
                color: projectView === 'list' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (projectView !== 'list') {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (projectView !== 'list') {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
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
        
        {/* Guidance */}
        <TeamsVsDirectGuidance />
      </div>

      {/* Filters and Group By */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="input-theme pl-10 pr-4 py-2"
            />
          </div>
          <FilterPanel
            filters={projectFilterConfigs}
            values={projectFilters}
            onChange={(key, value) => setProjectFilters(prev => ({ ...prev, [key]: value }))}
            onClear={() => setProjectFilters({ workflow: null, role: null, team: null, accessSource: null })}
          />
          <label className="flex items-center space-x-2 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded transition-colors"
              style={{
                borderColor: 'var(--border-default)',
                color: 'var(--accent-primary)',
              }}
            />
            <span>Show archived</span>
          </label>
        </div>
        
        {/* Group By Selector */}
        <div className="flex items-center gap-3">
          <span className="text-body-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Group by:
          </span>
          <div className="flex items-center gap-1 p-1 border rounded-lg" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => setGroupBy('none')}
              className="px-3 py-1.5 rounded text-body-sm transition-all duration-150"
              style={{
                backgroundColor: groupBy === 'none' ? 'var(--accent-primary-glow)' : 'transparent',
                color: groupBy === 'none' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (groupBy !== 'none') {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (groupBy !== 'none') {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Layers className="h-4 w-4 inline mr-1.5" />
              None
            </button>
            <button
              onClick={() => setGroupBy('workflow')}
              className="px-3 py-1.5 rounded text-body-sm transition-all duration-150"
              style={{
                backgroundColor: groupBy === 'workflow' ? 'var(--accent-primary-glow)' : 'transparent',
                color: groupBy === 'workflow' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (groupBy !== 'workflow') {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (groupBy !== 'workflow') {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <LayoutGrid className="h-4 w-4 inline mr-1.5" />
              Workflow
            </button>
            <button
              onClick={() => setGroupBy('team')}
              className="px-3 py-1.5 rounded text-body-sm transition-all duration-150"
              style={{
                backgroundColor: groupBy === 'team' ? 'var(--accent-primary-glow)' : 'transparent',
                color: groupBy === 'team' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (groupBy !== 'team') {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (groupBy !== 'team') {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Building2 className="h-4 w-4 inline mr-1.5" />
              Team
            </button>
          </div>
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
        <div 
          className="border rounded-lg p-4"
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            borderColor: 'var(--status-danger)',
          }}
        >
          <p className="text-body-sm" style={{ color: 'var(--status-danger)' }}>Failed to load projects. Please try again.</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<Folder className="h-16 w-16" style={{ color: 'var(--text-tertiary)' }} />}
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
      ) : groupedProjects && Object.keys(groupedProjects).length > 0 ? (
        // Grouped view
        <div className="space-y-6">
          {Object.entries(groupedProjects).map(([groupName, groupProjects]) => (
            <div key={groupName} className="space-y-4">
              <div className="flex items-center gap-3">
                {groupBy === 'team' ? (
                  <Building2 className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                ) : (
                  <LayoutGrid className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                )}
                <h2 className="text-h2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {groupName}
                </h2>
                <Badge variant="default" className="text-xs">
                  {groupProjects.length} {groupProjects.length === 1 ? 'project' : 'projects'}
                </Badge>
              </div>
              {projectView === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupProjects.map((project: Project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      view="grid"
                      getTimeAgo={getTimeAgo}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupProjects.map((project: Project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      view="list"
                      getTimeAgo={getTimeAgo}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : projectView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={project}
              view="grid"
              getTimeAgo={getTimeAgo}
            />
          ))}

          {/* Create New Project Card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-150 min-h-[200px]"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-tertiary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-accent)';
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <Plus className="w-12 h-12 mb-3 opacity-50" />
            <span className="font-medium">Create new project</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={project}
              view="list"
              getTimeAgo={getTimeAgo}
            />
          ))}

          {/* Create New Project Card (List View) */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full border-2 border-dashed rounded-xl p-6 flex items-center justify-center gap-3 transition-all duration-150"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-tertiary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-accent)';
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <Plus className="w-6 h-6 opacity-50" />
            <span className="font-medium">Create new project</span>
          </button>
        </div>
      )}

      {/* Pagination info */}
      {data && data.totalElements > 0 && (
        <div className="text-center text-body-sm" style={{ color: 'var(--text-tertiary)' }}>
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
