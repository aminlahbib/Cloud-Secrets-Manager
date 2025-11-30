import React from 'react';
import { Building2, User, Link as LinkIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { Project, ProjectTeamInfo } from '../../types';

interface ProjectSourceIndicatorProps {
  project: Project;
  showDetailed?: boolean;
}

export const ProjectSourceIndicator: React.FC<ProjectSourceIndicatorProps> = ({
  project,
  showDetailed = false,
}) => {
  const hasDirectAccess = project.currentUserRole !== undefined;
  const hasTeamAccess = project.teams && project.teams.length > 0;
  const accessSource = project.accessSource;

  if (!hasDirectAccess && !hasTeamAccess) {
    return null;
  }

  if (showDetailed) {
    return (
      <div className="flex flex-col gap-2">
        {hasDirectAccess && (
          <div className="flex items-center gap-2 text-body-sm">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Direct Access
              </span>
            </div>
            <Badge variant="owner-admin" className="text-xs">
              {project.currentUserRole}
            </Badge>
          </div>
        )}
        {hasTeamAccess && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-body-sm">
              <Building2 className="h-3.5 w-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Team Access
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-5">
              {project.teams?.map((team: ProjectTeamInfo) => (
                <Badge key={team.teamId} variant="info" className="text-xs">
                  <Building2 className="h-2.5 w-2.5 mr-1" />
                  {team.teamName}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact view
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {accessSource === 'DIRECT' && (
        <Badge variant="default" title="Direct project membership">
          <User className="h-3 w-3 mr-1" />
          Direct
        </Badge>
      )}
      {accessSource === 'TEAM' && (
        <Badge variant="info" title="Access via team membership">
          <Building2 className="h-3 w-3 mr-1" />
          Team
        </Badge>
      )}
      {accessSource === 'BOTH' && (
        <Badge variant="info" title="Access via both direct membership and team">
          <LinkIcon className="h-3 w-3 mr-1" />
          Team + Direct
        </Badge>
      )}
      {project.teams && project.teams.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {project.teams.slice(0, 2).map((team: ProjectTeamInfo) => (
            <Badge key={team.teamId} variant="default" className="text-xs">
              <Building2 className="h-2.5 w-2.5 mr-1" />
              {team.teamName}
            </Badge>
          ))}
          {project.teams.length > 2 && (
            <Badge variant="default" className="text-xs">
              +{project.teams.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

