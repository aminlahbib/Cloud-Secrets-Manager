import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="card">
      <div className="padding-card border-b border-theme-subtle">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-theme-primary">Your Teams</h2>
          <Link 
            to="/teams" 
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
      ) : !teams || teams.length === 0 ? (
        <div className="p-12 text-center">
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
        <div className="space-y-3 padding-card">
          {displayTeams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="group block p-4 rounded-xl border border-theme-subtle transition-all duration-150 card hover:border-theme-default"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl transition-all duration-150 bg-elevation-1 text-theme-tertiary group-hover:bg-accent-primary-glow group-hover:text-accent-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-theme-primary truncate text-body-sm">
                      {team.name}
                    </h3>
                    {team.currentUserRole === 'TEAM_OWNER' && (
                      <Badge variant="owner-admin" className="text-xs">Owner</Badge>
                    )}
                    {team.currentUserRole === 'TEAM_ADMIN' && (
                      <Badge variant="info" className="text-xs">Admin</Badge>
                    )}
                  </div>
                  {team.description && (
                    <p className="text-caption text-theme-secondary line-clamp-1 mb-1.5">
                      {team.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-body-sm text-theme-secondary">
                    <span className="flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      {team.memberCount ?? 0} members
                    </span>
                    <span className="flex items-center">
                      <Folder className="h-3.5 w-3.5 mr-1" />
                      {team.projectCount ?? 0} projects
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {teams.length > maxTeams && (
            <div className="pt-2">
              <Link
                to="/teams"
                className="block text-center text-body-sm font-medium text-accent-primary hover:underline"
              >
                View {teams.length - maxTeams} more team{teams.length - maxTeams !== 1 ? 's' : ''}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

