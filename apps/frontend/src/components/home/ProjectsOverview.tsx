import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Folder, Key, Users, Plus, LayoutGrid, ArrowRight, Building2 } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Project } from '../../types';

interface ProjectsOverviewProps {
  projects: Project[];
  isLoading: boolean;
}

export const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({
  projects,
  isLoading,
}) => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-primary">Your Projects</h2>
          <p className="text-body-sm text-theme-secondary mt-1">
            Manage and access your projects
          </p>
        </div>
        <Link 
          to="/projects" 
          className="text-body-sm font-medium text-accent-primary hover:text-accent-primary-hover transition-colors flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <Folder className="h-16 w-16 mx-auto mb-4 text-theme-tertiary" />
          <h3 className="text-xl font-semibold text-theme-primary mb-2">No projects yet</h3>
          <p className="text-body text-theme-secondary mb-6 max-w-md">
            Create your first project to start managing secrets and collaborating with your team
          </p>
          <Button onClick={() => navigate('/projects')} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.slice(0, 8).map((project: Project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              title={`${project.name} - ${project.workflowName || 'No workflow'}${project.teams && project.teams.length > 0 ? ` - ${project.teams.map(t => t.teamName).join(', ')}` : ''}`}
            >
              <div className="flex flex-col h-full">
                {/* Project name and role */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-theme-primary mb-1 line-clamp-2 group-hover:text-accent-primary transition-colors">
                      {project.name}
                    </h3>
                    {project.currentUserRole && (
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-elevation-2 text-theme-secondary">
                        {project.currentUserRole}
                      </span>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-elevation-1 text-theme-tertiary group-hover:bg-accent-primary-glow group-hover:text-accent-primary transition-colors ml-3 flex-shrink-0">
                    <Folder className="h-5 w-5" />
                  </div>
                </div>

                {/* Workflow and Team - simplified */}
                <div className="space-y-2 mb-4 flex-1">
                  {project.workflowName && (
                    <div className="flex items-center gap-2 text-body-sm text-theme-secondary">
                      <LayoutGrid className="h-3.5 w-3.5 text-theme-tertiary flex-shrink-0" />
                      <span className="truncate">{project.workflowName}</span>
                    </div>
                  )}
                  {project.teams && project.teams.length > 0 && (
                    <div className="flex items-center gap-2 text-body-sm text-theme-secondary">
                      <Building2 className="h-3.5 w-3.5 text-theme-tertiary flex-shrink-0" />
                      <span className="truncate">
                        {project.teams[0].teamName}
                        {project.teams.length > 1 && ` +${project.teams.length - 1}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats - simplified */}
                <div className="flex items-center gap-4 pt-4 border-t border-theme-subtle text-body-sm text-theme-secondary">
                  <span className="flex items-center gap-1.5">
                    <Key className="h-4 w-4" />
                    <span className="font-semibold text-theme-primary">{project.secretCount ?? 0}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold text-theme-primary">{project.memberCount ?? 1}</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

