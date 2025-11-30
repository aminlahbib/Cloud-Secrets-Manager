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
  if (view === 'grid') {
    return (
      <Link
        to={`/projects/${project.id}`}
        className="block group"
      >
        <div 
          className="card h-full flex flex-col"
          style={{
            opacity: project.isArchived ? 0.75 : 1,
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div 
              className="p-3 rounded-lg transition-all duration-150"
              style={{ 
                backgroundColor: 'var(--elevation-1)',
                color: 'var(--text-tertiary)',
              }}
              onMouseEnter={(e) => {
                if (!project.isArchived) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!project.isArchived) {
                  e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }
              }}
            >
              {project.isArchived ? (
                <Archive className="w-8 h-8" />
              ) : (
                <Folder className="w-8 h-8" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
          </div>

          <div className="flex-1">
            <h3 className="text-h3 font-semibold text-primary mb-2">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-body-sm text-secondary line-clamp-2 mb-3">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {project.workflowName && (
                <div className="flex items-center gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-caption text-tertiary font-medium">
                    {project.workflowName}
                  </span>
                </div>
              )}
              {project.teams && project.teams.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-caption text-tertiary font-medium">
                    {project.teams.map((t: ProjectTeamInfo) => t.teamName).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between text-body-sm" style={{ borderTopColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-4" style={{ color: 'var(--text-tertiary)' }}>
              <span className="flex items-center" title="Secrets">
                <Key className="h-4 w-4 mr-1" />
                {project.secretCount ?? 0}
              </span>
              <span className="flex items-center" title="Members">
                <Users className="h-4 w-4 mr-1" />
                {project.memberCount ?? 1}
              </span>
            </div>
            <span className="flex items-center" style={{ color: 'var(--text-tertiary)' }} title="Last updated">
              <Clock className="h-4 w-4 mr-1" />
              {getTimeAgo(project.updatedAt)}
            </span>
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

