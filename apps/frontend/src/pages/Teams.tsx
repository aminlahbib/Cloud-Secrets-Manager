import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Building2,
  Settings,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { teamsService } from '../services/teams';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { CreateTeamModal } from '../components/teams/CreateTeamModal';
import type { Team } from '../types';
import { useNavigate } from 'react-router-dom';

// Generate theme-aware gradient style for a team based on its name
// Uses CSS variables that adapt to the current theme and color mode
// The gradient matches the theme's background gradient pattern with per-team variation
const getTeamGradientStyle = (teamName: string): React.CSSProperties => {
  // Create a hash from the team name for consistency
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use hash to determine gradient direction (subtle variation per team)
  // Base direction matches theme gradients (135deg) with ±30deg variation
  const direction = 135 + (Math.abs(hash) % 60) - 30; // 105 to 165 degrees
  
  // Use elevation colors that adapt to theme automatically
  // This creates a subtle gradient similar to the theme's background gradients
  // Each team gets a slightly different direction for visual distinction
  return {
    background: `linear-gradient(${direction}deg, var(--elevation-2), var(--elevation-1))`,
  };
};

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // Fetch teams
  const { data: teams, isLoading, error } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => teamsService.listTeams(),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) => teamsService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showNotification({
        type: 'success',
        title: 'Team deleted',
        message: 'The team has been deleted successfully',
      });
      setShowDeleteConfirm(false);
      setTeamToDelete(null);
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Failed to delete team',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    },
  });


  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (teamToDelete) {
      deleteTeamMutation.mutate(teamToDelete.id);
    }
  };

  const canManageTeam = (team: Team) => {
    return team.currentUserRole === 'TEAM_OWNER' || team.currentUserRole === 'TEAM_ADMIN';
  };

  const canDeleteTeam = (team: Team) => {
    return team.currentUserRole === 'TEAM_OWNER';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Users className="h-16 w-16 text-theme-tertiary" />}
        title="Error loading teams"
        description="Failed to load teams. Please try again."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Teams</h1>
          <p className="text-body-sm text-theme-secondary mt-1">
            Manage team members and access controls
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="w-5 h-5 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Teams List */}
      {!teams || teams.length === 0 ? (
        <EmptyState
          icon={<Users className="h-16 w-16 text-theme-tertiary" />}
          title="No teams yet"
          description="Create your first team to start collaborating"
          action={{
            label: 'Create Team',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
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
                className="card rounded-xl p-6 shadow-sm transition-all group"
                style={{
                  borderColor: 'var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full border flex items-center justify-center font-bold text-lg"
                      style={{ 
                        ...teamGradientStyle,
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      {teamInitials}
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {team.name}
                      </h3>
                      {team.currentUserRole && (
                        <span 
                          className="text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                          style={{
                            backgroundColor: 'var(--elevation-1)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {team.currentUserRole.replace('TEAM_', '')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {team.description && (
                  <p className="text-sm mb-6 h-10 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {team.description || "No description provided for this team."}
                  </p>
                )}

                <div 
                  className="flex items-center gap-4 mb-6 border-t border-b py-3"
                  style={{
                    borderTopColor: 'var(--border-subtle)',
                    borderBottomColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <span>{team.memberCount || 0} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Building2 className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <span>{team.projectCount || 0} projects</span>
                  </div>
                </div>

                {canManageTeam(team) && (
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teams/${team.id}`);
                      }}
                      className="flex-1 py-2 px-3 border rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      Manage
                    </button>
                    {canDeleteTeam(team) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTeam(team);
                        }}
                        className="py-2 px-3 border rounded-lg text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--status-danger)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--status-danger-bg)';
                          e.currentTarget.style.borderColor = 'var(--status-danger)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['teams'] });
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTeamToDelete(null);
        }}
        title="Delete Team"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-theme-primary">
            Are you sure you want to delete <strong>{teamToDelete?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-theme-subtle">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteConfirm(false);
                setTeamToDelete(null);
              }}
              disabled={deleteTeamMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={deleteTeamMutation.isPending}
            >
              Delete Team
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
