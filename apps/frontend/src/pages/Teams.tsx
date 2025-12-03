import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  Settings,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { usePreferences } from '../hooks/usePreferences';
import { useDebounce } from '../utils/debounce';
import { teamsService } from '../services/teams';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/shared/PageHeader';
import { CreateTeamModal } from '../components/teams/CreateTeamModal';
import type { Team } from '../types';
import { useI18n } from '../contexts/I18nContext';

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
  const { teamView, setTeamView } = usePreferences();
  const { t } = useI18n();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch teams
  const { data: teams, isLoading, error } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => teamsService.listTeams(),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Filter teams by search term
  const filteredTeams = React.useMemo(() => {
    if (!teams) return [];
    if (!debouncedSearchTerm.trim()) return teams;
    const search = debouncedSearchTerm.toLowerCase();
    return teams.filter(team =>
      team.name.toLowerCase().includes(search) ||
      (team.description && team.description.toLowerCase().includes(search))
    );
  }, [teams, debouncedSearchTerm]);

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
        title={t('teams.errorTitle')}
        description={t('teams.errorDescription')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('teams.title')}
        description={t('teams.description')}
        view={teamView}
        onViewChange={setTeamView}
        onCreateNew={() => setShowCreateModal(true)}
        createButtonLabel={t('teams.newTeam')}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('teams.searchPlaceholder')}
      />

      {/* Teams List */}
      {!teams || teams.length === 0 ? (
        <EmptyState
          icon={<Users className="h-16 w-16 text-theme-tertiary" />}
          title={t('teams.emptyTitle')}
          description={t('teams.emptyDescription')}
          action={{
            label: t('teams.createTeamLabel'),
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : teamView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
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
                onClick={() => navigate(`/teams/${team.id}?tab=overview`)}
                className="card rounded-xl p-6 shadow-sm transition-all group flex flex-col h-full cursor-pointer"
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
                {/* Header Section */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full border flex items-center justify-center font-bold text-lg flex-shrink-0"
                      style={{ 
                        ...teamGradientStyle,
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      {teamInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
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
                
                {/* Description Section */}
                <div className="mb-4 min-h-[2.5rem]">
                  {team.description ? (
                    <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {team.description}
                    </p>
                  ) : (
                    <p className="text-sm line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                      No description provided for this team.
                    </p>
                  )}
                </div>

                {/* Stats Section */}
                <div 
                  className="flex items-center gap-4 mb-6 border-t border-b py-3"
                  style={{
                    borderTopColor: 'var(--border-subtle)',
                    borderBottomColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    <span>{team.memberCount || 0} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    <span>{team.projectCount || 0} projects</span>
                  </div>
                </div>

                {/* Action Buttons - Pushed to Bottom */}
                {canManageTeam(team) && (
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teams/${team.id}?tab=overview`);
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
      ) : (
        <div className="space-y-3">
          {filteredTeams.map((team) => {
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
                onClick={() => navigate(`/teams/${team.id}?tab=overview`)}
                className="card rounded-xl p-4 shadow-sm transition-all cursor-pointer hover:shadow-theme-md"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div 
                      className="w-12 h-12 rounded-full border flex items-center justify-center font-bold text-lg flex-shrink-0"
                      style={{ 
                        ...teamGradientStyle,
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      {teamInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                          {team.name}
                        </h3>
                        {team.currentUserRole && (
                          <span 
                            className="text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: 'var(--elevation-1)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {team.currentUserRole.replace('TEAM_', '')}
                          </span>
                        )}
                      </div>
                      {team.description && (
                        <p className="text-sm truncate mb-2" style={{ color: 'var(--text-secondary)' }}>
                          {team.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          {team.memberCount || 0} members
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          {team.projectCount || 0} projects
                        </span>
                      </div>
                    </div>
                  </div>
                  {canManageTeam(team) && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/teams/${team.id}?tab=overview`);
                        }}
                        className="py-2 px-3 border rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
