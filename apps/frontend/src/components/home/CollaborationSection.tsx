import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Folder, Building2, Users, Plus, ArrowRight, LayoutGrid } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import type { Workflow, Team } from '../../types';

interface CollaborationSectionProps {
  workflows: Workflow[] | undefined;
  isWorkflowsLoading: boolean;
  maxTeams?: number;
}

export const CollaborationSection: React.FC<CollaborationSectionProps> = ({
  workflows,
  isWorkflowsLoading,
  maxTeams = 3,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch teams
  const { data: teams, isLoading: isTeamsLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => import('../../services/teams').then(m => m.teamsService.listTeams()),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const displayTeams = teams?.slice(0, maxTeams) ?? [];

  return (
    <div className="card">
      <div className="padding-card border-b border-theme-subtle">
        <h2 className="text-h2 font-bold text-theme-primary">Collaboration</h2>
        <p className="text-body-sm text-theme-secondary mt-1">
          Workflows and teams you're part of
        </p>
      </div>

      <div className="divide-y divide-theme-subtle">
        {/* Workflows Section */}
        <div className="padding-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-body font-semibold text-theme-primary flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-theme-tertiary" />
              Workflows
            </h3>
            <Link
              to="/workflows/new"
              className="text-xs font-medium text-accent-primary hover:text-accent-primary-hover transition-colors"
            >
              New <Plus className="h-3 w-3 inline ml-0.5" />
            </Link>
          </div>

          {isWorkflowsLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : !workflows || workflows.length === 0 ? (
            <p className="text-caption text-theme-tertiary text-center py-4">
              No workflows yet
            </p>
          ) : (
            <div className="space-y-2">
              {workflows.map((workflow) => (
                <Link
                  key={workflow.id}
                  to={`/workflows/${workflow.id}`}
                  className="block p-3 rounded-lg hover:bg-elevation-1 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-theme-primary truncate group-hover:text-accent-primary transition-colors">
                        {workflow.name}
                        {workflow.isDefault && (
                          <span className="ml-2 text-caption text-theme-tertiary">(Default)</span>
                        )}
                      </p>
                      <p className="text-caption text-theme-tertiary mt-0.5">
                        {workflow.projects?.length || 0} projects
                      </p>
                    </div>
                    <Folder className="h-4 w-4 text-theme-tertiary flex-shrink-0 ml-2" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Teams Section */}
        <div className="padding-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-body font-semibold text-theme-primary flex items-center gap-2">
              <Building2 className="h-4 w-4 text-theme-tertiary" />
              Teams
            </h3>
            <button
              onClick={() => navigate('/teams')}
              className="text-xs font-medium text-accent-primary hover:text-accent-primary-hover transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {isTeamsLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : !teams || teams.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-caption text-theme-tertiary mb-3">
                No teams yet
              </p>
              <Button size="sm" onClick={() => navigate('/teams')}>
                <Plus className="h-3 w-3 mr-1.5" />
                Create Team
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {displayTeams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="p-3 rounded-lg hover:bg-elevation-1 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-body-sm font-medium text-theme-primary truncate group-hover:text-accent-primary transition-colors">
                          {team.name}
                        </p>
                        {team.currentUserRole === 'TEAM_OWNER' && (
                          <Badge variant="owner-admin" className="text-xs">Owner</Badge>
                        )}
                        {team.currentUserRole === 'TEAM_ADMIN' && (
                          <Badge variant="info" className="text-xs">Admin</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-caption text-theme-tertiary">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {team.memberCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Folder className="h-3 w-3" />
                          {team.projectCount ?? 0}
                        </span>
                      </div>
                    </div>
                    <Building2 className="h-4 w-4 text-theme-tertiary flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
              {teams.length > maxTeams && (
                <button
                  onClick={() => navigate('/teams')}
                  className="w-full text-center text-xs font-medium text-accent-primary hover:underline py-2"
                >
                  View {teams.length - maxTeams} more
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

