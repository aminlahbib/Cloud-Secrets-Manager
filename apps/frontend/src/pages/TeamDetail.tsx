import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  Crown,
  Shield,
  Mail,
  Trash2,
  Plus,
  X,
  Folder,
  ExternalLink,
  ArrowLeft,
  Edit,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { teamsService } from '../services/teams';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { CreateTeamModal } from '../components/teams/CreateTeamModal';
import { AddMemberModal } from '../components/teams/AddMemberModal';
import { AddProjectModal } from '../components/teams/AddProjectModal';
import type { Team, TeamMember, TeamRole, TeamProject } from '../types';

const ROLE_ICONS: Record<TeamRole, React.ReactNode> = {
  TEAM_OWNER: <Crown className="h-3 w-3" />,
  TEAM_ADMIN: <Shield className="h-3 w-3" />,
  TEAM_MEMBER: null,
};

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch team details
  const { data: team, isLoading: isTeamLoading, error: teamError } = useQuery<Team>({
    queryKey: ['teams', teamId],
    queryFn: () => teamsService.getTeam(teamId!),
    enabled: !!teamId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch team members
  const { data: members, isLoading: isMembersLoading } = useQuery<TeamMember[]>({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () => teamsService.listTeamMembers(teamId!),
    enabled: !!teamId,
  });

  // Fetch team projects
  const { data: teamProjects, isLoading: isProjectsLoading } = useQuery<TeamProject[]>({
    queryKey: ['teams', teamId, 'projects'],
    queryFn: () => teamsService.listTeamProjects(teamId!),
    enabled: !!teamId,
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => teamsService.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showNotification({
        type: 'success',
        title: 'Team deleted',
        message: 'The team has been deleted successfully',
      });
      navigate('/teams');
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
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
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

  // Remove project mutation
  const removeProjectMutation = useMutation({
    mutationFn: ({ teamId, projectId }: { teamId: string; projectId: string }) =>
      teamsService.removeProjectFromTeam(teamId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showNotification({
        type: 'success',
        title: 'Project removed',
        message: 'The project has been removed from the team',
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Failed to remove project',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    },
  });

  const canManageTeam = () => {
    return team?.currentUserRole === 'TEAM_OWNER' || team?.currentUserRole === 'TEAM_ADMIN';
  };

  const canDeleteTeam = () => {
    return team?.currentUserRole === 'TEAM_OWNER';
  };

  if (isTeamLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="space-y-6">
        <Button variant="secondary" onClick={() => navigate('/teams')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teams
        </Button>
        <EmptyState
          icon={<Building2 className="h-16 w-16 text-theme-tertiary" />}
          title="Team not found"
          description="The team you're looking for doesn't exist or you don't have access to it."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/teams')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                {team.name}
              </h1>
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
            {team.description && (
              <p className="mt-1 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                {team.description}
              </p>
            )}
          </div>
        </div>
        {canManageTeam() && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowEditModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Team
            </Button>
            {canDeleteTeam() && (
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Team
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-elevation-1">
              <Users className="h-5 w-5 text-theme-tertiary" />
            </div>
            <div>
              <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                Members
              </p>
              <p className="text-2xl font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                {team.memberCount || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-elevation-1">
              <Folder className="h-5 w-5 text-theme-tertiary" />
            </div>
            <div>
              <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                Projects
              </p>
              <p className="text-2xl font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                {team.projectCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="card">
        <div className="padding-card border-b border-theme-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
              Members ({members?.length || 0})
            </h2>
            {canManageTeam() && (
              <Button size="sm" onClick={() => setShowAddMemberModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            )}
          </div>
        </div>

        {isMembersLoading ? (
          <div className="padding-card flex justify-center">
            <Spinner size="md" />
          </div>
        ) : !members || members.length === 0 ? (
          <div className="padding-card">
            <EmptyState
              icon={<Users className="h-12 w-12 text-theme-tertiary" />}
              title="No members"
              description="Add members to start collaborating"
            />
          </div>
        ) : (
          <div className="divide-y divide-theme-subtle">
            {members.map((member) => (
              <div
                key={member.id}
                className="padding-card flex items-center justify-between hover:bg-elevation-1 transition-colors"
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
                  {canManageTeam() && member.userId !== user?.id && (
                    <button
                      onClick={() =>
                        removeMemberMutation.mutate({
                          teamId: team.id,
                          memberId: member.userId,
                        })
                      }
                      className="p-2 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                      title="Remove member"
                      disabled={removeMemberMutation.isPending}
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

      {/* Projects Section */}
      <div className="card">
        <div className="padding-card border-b border-theme-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
              Projects ({teamProjects?.length || 0})
            </h2>
            {canManageTeam() && (
              <Button size="sm" variant="secondary" onClick={() => setShowAddProjectModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Project
              </Button>
            )}
          </div>
        </div>

        {isProjectsLoading ? (
          <div className="padding-card flex justify-center">
            <Spinner size="md" />
          </div>
        ) : !teamProjects || teamProjects.length === 0 ? (
          <div className="padding-card">
            <EmptyState
              icon={<Folder className="h-12 w-12 text-theme-tertiary" />}
              title="No projects"
              description="Add projects to this team to share access with all team members"
            />
          </div>
        ) : (
          <div className="divide-y divide-theme-subtle">
            {teamProjects.map((teamProject) => (
              <div
                key={teamProject.id}
                className="padding-card flex items-center justify-between hover:bg-elevation-1 transition-colors"
              >
                <Link
                  to={`/projects/${teamProject.projectId}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="p-2 rounded-lg bg-elevation-1">
                    <Folder className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                      {teamProject.projectName}
                    </p>
                    {teamProject.projectDescription && (
                      <p className="text-xs transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                        {teamProject.projectDescription}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-theme-tertiary" />
                </Link>
                {canManageTeam() && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeProjectMutation.mutate({
                        teamId: team.id,
                        projectId: teamProject.projectId,
                      });
                    }}
                    className="ml-2 p-2 rounded-lg text-status-danger hover:bg-elevation-2 transition-colors"
                    title="Remove project"
                    disabled={removeProjectMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {team && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          teamId={team.id}
          canAssignOwner={team.currentUserRole === 'TEAM_OWNER'}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['teams', team.id, 'members'] });
            queryClient.invalidateQueries({ queryKey: ['teams', team.id] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
          }}
        />
      )}

      {/* Add Project Modal */}
      {team && (
        <AddProjectModal
          isOpen={showAddProjectModal}
          onClose={() => setShowAddProjectModal(false)}
          teamId={team.id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['teams', team.id, 'projects'] });
            queryClient.invalidateQueries({ queryKey: ['teams', team.id] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          }}
        />
      )}

      {/* Edit Team Modal - Reuse CreateTeamModal with edit mode */}
      {team && showEditModal && (
        <CreateTeamModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          team={team}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['teams', team.id] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            setShowEditModal(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Team"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
            Are you sure you want to delete <strong>{team.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-theme-subtle">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteTeamMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => team && deleteTeamMutation.mutate(team.id)}
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

