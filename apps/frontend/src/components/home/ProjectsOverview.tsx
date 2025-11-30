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
    <div className="card flex flex-col">
      <div className="padding-card border-b border-theme-subtle flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-theme-primary">Your Projects</h2>
          <Link 
            to="/projects" 
            className="text-body-sm font-medium flex items-center gap-1 transition-all duration-200 hover:gap-2 text-accent-primary hover:text-accent-primary-hover"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div className="padding-card flex justify-center items-center flex-1 min-h-[200px]">
          <Spinner size="lg" />
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center flex-1 flex flex-col items-center justify-center min-h-[300px]">
          <Folder className="h-12 w-12 mx-auto mb-4 text-theme-tertiary" />
          <h3 className="text-h3 font-medium text-theme-primary mb-2">No projects yet</h3>
          <p className="text-body-sm text-theme-secondary mb-6">Create your first project to start managing secrets</p>
          <Button onClick={() => navigate('/projects')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="padding-card">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project: Project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group relative block p-5 rounded-xl border border-theme-subtle bg-elevation-1 transition-all duration-200 hover:border-theme-default hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex flex-col h-full">
                  {/* Header with icon and badges */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-lg transition-all duration-200 bg-elevation-2 text-theme-tertiary group-hover:bg-accent-primary-glow group-hover:text-accent-primary group-hover:scale-110">
                      <Folder className="h-5 w-5" />
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

                  {/* Project name */}
                  <h3 className="font-semibold text-theme-primary mb-2 line-clamp-2 text-body-sm group-hover:text-accent-primary transition-colors">
                    {project.name}
                  </h3>

                  {/* Workflow and Team info */}
                  <div className="flex flex-col gap-1.5 mb-3 flex-1">
                    {project.workflowName && (
                      <div className="flex items-center gap-1.5 text-caption">
                        <LayoutGrid className="h-3 w-3 text-theme-tertiary flex-shrink-0" />
                        <span className="text-theme-tertiary font-medium truncate">
                          {project.workflowName}
                        </span>
                      </div>
                    )}
                    {project.teams && project.teams.length > 0 && (
                      <div className="flex items-center gap-1.5 text-caption">
                        <Building2 className="h-3 w-3 text-theme-tertiary flex-shrink-0" />
                        <span className="text-theme-tertiary font-medium truncate">
                          {project.teams[0].teamName}
                          {project.teams.length > 1 && ` +${project.teams.length - 1}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats footer */}
                  <div className="flex items-center gap-4 pt-3 border-t border-theme-subtle text-body-sm text-theme-secondary">
                    <span className="flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5" />
                      <span className="font-medium">{project.secretCount ?? 0}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium">{project.memberCount ?? 1}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

