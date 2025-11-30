import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Folder, Key, Users, Plus, LayoutGrid, ArrowRight, Building2 } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProjectSourceIndicator } from '../projects/ProjectSourceIndicator';
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
    <div className="lg:col-span-2 card">
      <div className="padding-card border-b border-theme-subtle">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-theme-primary">Your Projects</h2>
          <Link 
            to="/projects" 
            className="text-body-sm font-medium flex items-center transition-all duration-150 hover:scale-105 text-accent-primary"
          >
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div className="padding-card flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center">
          <Folder className="h-12 w-12 mx-auto mb-4 text-theme-tertiary" />
          <h3 className="text-h3 font-medium text-theme-primary mb-2">No projects yet</h3>
          <p className="text-body-sm text-theme-secondary mb-6">Create your first project to start managing secrets</p>
          <Button onClick={() => navigate('/projects')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 padding-card">
          {projects.slice(0, 4).map((project: Project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group block p-4 rounded-xl border border-theme-subtle transition-all duration-150 card hover:border-theme-default"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl transition-all duration-150 bg-elevation-1 text-theme-tertiary group-hover:bg-accent-primary-glow group-hover:text-accent-primary">
                  <Folder className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-theme-primary truncate text-body-sm">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 mb-1.5 flex-wrap">
                    {project.workflowName && (
                      <div className="flex items-center gap-1.5">
                        <LayoutGrid className="h-3 w-3 text-theme-tertiary" />
                        <span className="text-caption text-theme-tertiary font-medium truncate">
                          {project.workflowName}
                        </span>
                      </div>
                    )}
                    {project.teams && project.teams.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-theme-tertiary" />
                        <span className="text-caption text-theme-tertiary font-medium truncate">
                          {project.teams[0].teamName}
                          {project.teams.length > 1 && ` +${project.teams.length - 1}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-body-sm text-theme-secondary">
                    <span className="flex items-center">
                      <Key className="h-3.5 w-3.5 mr-1" />
                      {project.secretCount ?? 0}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      {project.memberCount ?? 1}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {project.currentUserRole && (
                    <Badge 
                      variant={
                        project.currentUserRole === 'OWNER' ? 'owner-admin' :
                        project.currentUserRole === 'ADMIN' ? 'owner-admin' :
                        'default'
                      }
                      className="text-xs"
                    >
                      {project.currentUserRole}
                    </Badge>
                  )}
                  <ProjectSourceIndicator project={project} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

