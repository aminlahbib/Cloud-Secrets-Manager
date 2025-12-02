import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Folder, Plus, ArrowRight } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { ProjectCard } from '../projects/ProjectCard';
import type { Project } from '../../types';

interface ProjectsOverviewProps {
  projects: Project[];
  isLoading: boolean;
  getTimeAgo: (date: string) => string;
}

export const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({
  projects,
  isLoading,
  getTimeAgo,
}) => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Recent Projects
          </h2>
          <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage and access your projects
          </p>
        </div>
        <Link 
          to="/projects" 
          className="text-body-sm font-medium transition-colors flex items-center gap-1"
          style={{ color: 'var(--accent-primary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-primary-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--accent-primary)';
          }}
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
          <Folder className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No projects yet
          </h3>
          <p className="text-body mb-6 max-w-md" style={{ color: 'var(--text-secondary)' }}>
            Create your first project to start managing secrets and collaborating with your team
          </p>
          <Button onClick={() => navigate('/projects')} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.slice(0, 6).map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={project}
              view="grid"
              getTimeAgo={getTimeAgo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

