import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ArrowRight, Folder } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import type { Team } from '../../types';

interface CollaborationSectionProps {
  workflows?: any;
  isWorkflowsLoading?: boolean;
  maxTeams?: number;
}

export const CollaborationSection: React.FC<CollaborationSectionProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch teams
  const { data: teams, isLoading: isTeamsLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => import('../../services/teams').then(m => m.teamsService.listTeams()),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Show maximum 2 teams
  const displayTeams = teams && teams.length > 0 
    ? teams.slice(0, 2)
    : [];

  // Generate theme-aware gradient style for team avatars
  const getTeamGradientStyle = (teamName: string): React.CSSProperties => {
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const direction = 135 + (Math.abs(hash) % 60) - 30;
    return {
      background: `linear-gradient(${direction}deg, var(--elevation-2), var(--elevation-1))`,
    };
  };

  return (
    <div className="card">
      <div className="p-3 border-b border-theme-subtle">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-theme-primary">Teams</h2>
          <button
            onClick={() => navigate('/teams')}
            className="text-sm font-medium transition-colors flex items-center gap-1"
            style={{ color: 'var(--accent-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
          >
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isTeamsLoading ? (
        <div className="p-3 flex justify-center items-center">
          <Spinner size="sm" />
        </div>
      ) : !teams || teams.length === 0 ? (
        <div className="p-3 text-center">
          <p className="text-xs text-theme-tertiary mb-3">
            No teams yet
          </p>
          <Button size="sm" onClick={() => navigate('/teams')}>
            <Plus className="h-3 w-3 mr-1.5" />
            Create Team
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-theme-subtle">
          {displayTeams.map((team) => {
            const teamInitials = team.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            
            const teamGradientStyle = getTeamGradientStyle(team.name);
            
            return (
              <div
                key={team.id}
                onClick={() => navigate(`/teams/${team.id}`)}
                className="p-3 flex items-center justify-between hover:bg-elevation-1 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ 
                      ...teamGradientStyle,
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {teamInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-theme-primary truncate group-hover:text-accent-primary transition-colors">
                        {team.name}
                      </p>
                      {team.currentUserRole && (
                        <Badge 
                          variant={team.currentUserRole === 'TEAM_OWNER' ? 'owner-admin' : team.currentUserRole === 'TEAM_ADMIN' ? 'info' : 'default'} 
                          className="text-xs flex-shrink-0"
                        >
                          {team.currentUserRole.replace('TEAM_', '')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-theme-tertiary">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {team.memberCount ?? 0} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Folder className="h-3 w-3" />
                        {team.projectCount ?? 0} projects
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-theme-tertiary flex-shrink-0 ml-2" />
              </div>
            );
          })}
          {teams.length > 2 && (
            <button
              onClick={() => navigate('/teams')}
              className="w-full p-3 text-center text-xs font-medium transition-colors hover:bg-elevation-1"
              style={{ color: 'var(--accent-primary)' }}
            >
              View {teams.length - 2} more
            </button>
          )}
        </div>
      )}
    </div>
  );
};

