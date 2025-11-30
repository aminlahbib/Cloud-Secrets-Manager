import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Folder, Plus, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import type { Team } from '../../types';

interface TeamsOverviewProps {
  maxTeams?: number;
}

export const TeamsOverview: React.FC<TeamsOverviewProps> = ({ maxTeams = 3 }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch teams
  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => import('../../services/teams').then(m => m.teamsService.listTeams()),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const displayTeams = teams?.slice(0, maxTeams) ?? [];

  return (
    <div className="card flex flex-col">
      <div className="padding-card border-b border-theme-subtle flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-theme-primary">Your Teams</h2>
          <button
            onClick={() => navigate('/teams')}
            className="text-body-sm font-medium flex items-center gap-1 transition-all duration-200 hover:gap-2 text-accent-primary hover:text-accent-primary-hover"
          >
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="padding-card flex justify-center items-center min-h-[150px]">
          <Spinner size="lg" />
        </div>
      ) : !teams || teams.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[250px]">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-theme-tertiary" />
          <h3 className="text-h3 font-medium text-theme-primary mb-2">No teams yet</h3>
          <p className="text-body-sm text-theme-secondary mb-6">
            Create a team to collaborate on multiple projects
          </p>
          <Button onClick={() => navigate('/teams')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>
      ) : (
        <div className="padding-card">
          <div className="space-y-3">
            {displayTeams.map((team) => (
              <div
                key={team.id}
                onClick={() => navigate(`/teams/${team.id}`)}
                className="group block p-4 rounded-xl border border-theme-subtle bg-elevation-1 transition-all duration-200 hover:border-theme-default hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg transition-all duration-200 bg-elevation-2 text-theme-tertiary group-hover:bg-accent-primary-glow group-hover:text-accent-primary group-hover:scale-110">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-semibold text-theme-primary truncate text-body-sm group-hover:text-accent-primary transition-colors">
                        {team.name}
                      </h3>
                      {team.currentUserRole === 'TEAM_OWNER' && (
                        <Badge variant="owner-admin" className="text-xs flex-shrink-0">Owner</Badge>
                      )}
                      {team.currentUserRole === 'TEAM_ADMIN' && (
                        <Badge variant="info" className="text-xs flex-shrink-0">Admin</Badge>
                      )}
                    </div>
                    {team.description && (
                      <p className="text-caption text-theme-secondary line-clamp-1 mb-2">
                        {team.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-body-sm text-theme-secondary">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-medium">{team.memberCount ?? 0}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Folder className="h-3.5 w-3.5" />
                        <span className="font-medium">{team.projectCount ?? 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {teams.length > maxTeams && (
              <div className="pt-2">
                <button
                  onClick={() => navigate('/teams')}
                  className="block w-full text-center text-body-sm font-medium text-accent-primary hover:underline transition-colors"
                >
                  View {teams.length - maxTeams} more team{teams.length - maxTeams !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

