import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Building2,
  Crown,
  Shield,
  Mail,
  Settings,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { teamsService } from '../services/teams';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { CreateTeamModal } from '../components/teams/CreateTeamModal';
import { AddMemberModal } from '../components/teams/AddMemberModal';
import type { Team, TeamMember, TeamRole } from '../types';

const ROLE_ICONS: Record<TeamRole, React.ReactNode> = {
  TEAM_OWNER: <Crown className="h-3 w-3" />,
  TEAM_ADMIN: <Shield className="h-3 w-3" />,
  TEAM_MEMBER: null,
};

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // Fetch teams
  const { data: teams, isLoading, error } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => teamsService.listTeams(),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch team members when a team is selected
  const { data: members, isLoading: isMembersLoading } = useQuery<TeamMember[]>({
    queryKey: ['teams', selectedTeam?.id, 'members'],
    queryFn: () => teamsService.listTeamMembers(selectedTeam!.id),
    enabled: !!selectedTeam?.id,
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
      if (selectedTeam?.id === teamToDelete?.id) {
        setSelectedTeam(null);
      }
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Failed to delete team',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      teamsService.removeTeamMember(teamId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showNotification({
        type: 'success',
        title: 'Member removed',
        message: 'The member has been removed from the team',
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Failed to remove member',
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
          <h1 className="text-2xl font-bold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
            Teams
          </h1>
          <p className="mt-1 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
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
          {teams.map((team) => (
            <Card
              key={team.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setSelectedTeam(team)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                    {team.name}
                  </h3>
                  {team.description && (
                    <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                      {team.description}
                    </p>
                  )}
                </div>
                {team.currentUserRole && (
                  <Badge
                    variant={
                      team.currentUserRole === 'TEAM_OWNER' || team.currentUserRole === 'TEAM_ADMIN'
                        ? 'owner-admin'
                        : 'default'
                    }
                  >
                    {ROLE_ICONS[team.currentUserRole as TeamRole] && (
                      <span className="mr-1">{ROLE_ICONS[team.currentUserRole as TeamRole]}</span>
                    )}
                    {team.currentUserRole.replace('TEAM_', '')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{team.memberCount || 0} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{team.projectCount || 0} projects</span>
                </div>
              </div>

              {canManageTeam(team) && (
                <div className="mt-4 pt-4 border-t border-theme-subtle flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTeam(team);
                    }}
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  {canDeleteTeam(team) && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(team);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Team Detail Sidebar */}
      {selectedTeam && (
        <Modal
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
          title={selectedTeam.name}
          size="lg"
        >
          <div className="space-y-6">
            {/* Team Info */}
            <div>
              <h3 className="text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                Description
              </h3>
              <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                {selectedTeam.description || 'No description'}
              </p>
            </div>

            {/* Members Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                  Members ({members?.length || 0})
                </h3>
                {canManageTeam(selectedTeam) && (
                  <Button
                    size="sm"
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                )}
              </div>

              {isMembersLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="md" />
                </div>
              ) : !members || members.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-12 w-12 text-theme-tertiary" />}
                  title="No members"
                  description="Add members to start collaborating"
                />
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-theme-subtle"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-elevation-1 text-theme-tertiary">
                          <span className="font-medium">
                            {(member.displayName || member.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                            {member.displayName || member.email}
                            {member.userId === user?.id && (
                              <span className="ml-2 text-xs transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-xs flex items-center gap-1 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            member.role === 'TEAM_OWNER' || member.role === 'TEAM_ADMIN'
                              ? 'owner-admin'
                              : 'default'
                          }
                        >
                          {ROLE_ICONS[member.role] && <span className="mr-1">{ROLE_ICONS[member.role]}</span>}
                          {member.role.replace('TEAM_', '')}
                        </Badge>
                        {canManageTeam(selectedTeam) && member.userId !== user?.id && (
                          <button
                            onClick={() =>
                              removeMemberMutation.mutate({
                                teamId: selectedTeam.id,
                                memberId: member.userId,
                              })
                            }
                            className="p-2 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                            title="Remove member"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['teams'] });
        }}
      />

      {/* Add Member Modal */}
      {selectedTeam && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          teamId={selectedTeam.id}
          canAssignOwner={selectedTeam.currentUserRole === 'TEAM_OWNER'}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam.id, 'members'] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
          }}
        />
      )}

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
          <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
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
