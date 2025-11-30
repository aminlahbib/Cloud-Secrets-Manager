import React from 'react';
import { Link } from 'react-router-dom';
import {
  Folder,
  Archive,
  Crown,
  Shield,
  Key,
  Users,
  Clock,
  LayoutGrid,
  Building2,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ProjectSourceIndicator } from './ProjectSourceIndicator';
import type { Project, ProjectRole, ProjectTeamInfo } from '../../types';

const ROLE_COLORS: Record<ProjectRole, 'owner-admin' | 'owner-admin' | 'info' | 'default'> = {
  OWNER: 'owner-admin',
  ADMIN: 'owner-admin',
  MEMBER: 'info',
  VIEWER: 'default',
};

interface ProjectCardProps {
  project: Project;
  view: 'grid' | 'list';
  getTimeAgo: (date: string) => string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, view, getTimeAgo }) => {
  const getWorkflowStyle = (workflow: string) => {
    switch (workflow) {
      case 'Production': 
        return {
          backgroundColor: 'var(--status-success-bg)',
          color: 'var(--status-success)',
          borderColor: 'var(--status-success)',
        };
      case 'Staging': 
        return {
          backgroundColor: 'var(--status-warning-bg)',
          color: 'var(--status-warning)',
          borderColor: 'var(--status-warning)',
        };
      default: 
        return {
          backgroundColor: 'var(--elevation-1)',
          color: 'var(--text-secondary)',
          borderColor: 'var(--border-subtle)',
        };
    }
  };

  if (view === 'grid') {
    return (
      <Link
        to={`/projects/${project.id}`}
        className="block group h-full"
      >
        <div 
          className="group card rounded-xl p-5 transition-all duration-200 cursor-pointer hover:shadow-theme-md flex flex-col h-full"
          style={{
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0"
                style={{
                  backgroundColor: 'var(--elevation-1)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-tertiary)',
                }}
              >
                <Folder className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold leading-snug truncate" style={{ color: 'var(--text-primary)' }}>
                  {project.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {project.workflowName && (
                    <span 
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide"
                      style={getWorkflowStyle(project.workflowName)}
                    >
                      {project.workflowName}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {project.currentUserRole || 'Member'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4 min-h-[2.5rem] flex-1">
            {project.description ? (
              <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {project.description}
              </p>
            ) : (
              <p className="text-sm line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                No description
              </p>
            )}
          </div>

          {/* Footer metrics - Pushed to Bottom */}
          <div 
            className="flex items-center justify-between pt-4 border-t mt-auto"
            style={{ borderTopColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div 
                className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border flex-shrink-0" 
                title="Secrets"
                style={{
                  backgroundColor: 'var(--elevation-1)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Key className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                <span>{project.secretCount ?? 0}</span>
              </div>
              <div className="flex -space-x-1.5 flex-shrink-0">
                {[...Array(Math.min(3, project.memberCount ?? 1))].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold"
                    style={{
                      backgroundColor: 'var(--elevation-2)',
                      borderColor: 'var(--card-bg)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                {(project.memberCount ?? 1) > 3 && (
                  <div 
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold"
                    style={{
                      backgroundColor: 'var(--elevation-1)',
                      borderColor: 'var(--card-bg)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    +{(project.memberCount ?? 1) - 3}
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs flex items-center gap-1.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              <Clock className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{getTimeAgo(project.updatedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // List view
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block group"
    >
      <div 
        className="rounded-xl p-4 shadow-sm border transition-all flex items-center gap-4 card"
        style={{
          opacity: project.isArchived ? 0.75 : 1,
        }}
      >
        <div 
          className="p-3 rounded-lg transition-colors flex-shrink-0"
          style={{ backgroundColor: 'var(--elevation-1)' }}
          onMouseEnter={(e) => {
            if (!project.isArchived) {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
            }
          }}
          onMouseLeave={(e) => {
            if (!project.isArchived) {
              e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
            }
          }}
        >
          {project.isArchived ? (
            <Archive className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
          ) : (
            <Folder className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 className="text-h3 font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {project.name}
            </h3>
            {project.currentUserRole && (
              <Badge variant={ROLE_COLORS[project.currentUserRole]}>
                {project.currentUserRole === 'OWNER' && <Crown className="h-3 w-3 mr-1" />}
                {project.currentUserRole === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                {project.currentUserRole}
              </Badge>
            )}
            <ProjectSourceIndicator project={project} />
            {project.isArchived && (
              <Badge variant="warning">Archived</Badge>
            )}
          </div>
          {project.description && (
            <p className="text-body-sm line-clamp-1 mb-2" style={{ color: 'var(--text-secondary)' }}>
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-body-sm flex-wrap" style={{ color: 'var(--text-tertiary)' }}>
            {project.workflowName && (
              <div className="flex items-center gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{project.workflowName}</span>
              </div>
            )}
                    {project.teams && project.teams.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{project.teams.map((t: ProjectTeamInfo) => t.teamName).join(', ')}</span>
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
  );
};

