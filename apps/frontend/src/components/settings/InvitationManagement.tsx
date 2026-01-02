import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../../services/projects';
import { membersService } from '../../services/members';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { useNotifications } from '../../contexts/NotificationContext';
import { Clock, CheckCircle, XCircle, X, Mail } from 'lucide-react';
import type { Project, ProjectInvitation } from '../../types';

interface InvitationManagementProps {
  userId?: string;
}

export const InvitationManagement: React.FC<InvitationManagementProps> = ({ userId }) => {
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();

  // Fetch all projects where user is OWNER or ADMIN
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['user-projects'],
    queryFn: async () => {
      const allProjects = await projectsService.listProjects();
      return allProjects.filter(
        (p) => p.currentUserRole === 'OWNER' || p.currentUserRole === 'ADMIN'
      );
    },
    enabled: !!userId,
  });

  // Fetch invitations for each project
  const invitationsQueries = useQuery({
    queryKey: ['all-project-invitations', projects?.map((p) => p.id)],
    queryFn: async () => {
      if (!projects) return {};
      const invitationsMap: Record<string, ProjectInvitation[]> = {};
      await Promise.all(
        projects.map(async (project) => {
          try {
            const invitations = await membersService.listAllInvitations(project.id);
            invitationsMap[project.id] = invitations;
          } catch (error) {
            console.error(`Failed to fetch invitations for project ${project.id}:`, error);
            invitationsMap[project.id] = [];
          }
        })
      );
      return invitationsMap;
    },
    enabled: !!projects && projects.length > 0,
  });

  const invitationsByProject = invitationsQueries.data || {};

  // Group invitations by status
  const groupedInvitations = useMemo(() => {
    const grouped: Record<string, { pending: ProjectInvitation[]; accepted: ProjectInvitation[]; rejected: ProjectInvitation[] }> = {};
    Object.entries(invitationsByProject).forEach(([projectId, invitations]) => {
      grouped[projectId] = {
        pending: invitations.filter((inv) => inv.status === 'PENDING'),
        accepted: invitations.filter((inv) => inv.status === 'ACCEPTED'),
        rejected: invitations.filter((inv) => inv.status === 'REVOKED' || inv.status === 'EXPIRED'),
      };
    });
    return grouped;
  }, [invitationsByProject]);

  const revokeInvitationMutation = useMutation({
    mutationFn: ({ projectId, invitationId }: { projectId: string; invitationId: string }) =>
      membersService.revokeInvitation(projectId, invitationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-project-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['project-invitations', variables.projectId] });
      showNotification({
        type: 'success',
        title: 'Invitation cancelled',
        message: 'The invitation has been successfully cancelled',
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Failed to cancel invitation',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    },
  });

  const handleCancelInvitation = (projectId: string, invitationId: string) => {
    revokeInvitationMutation.mutate({ projectId, invitationId });
  };

  if (isLoadingProjects || invitationsQueries.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Mail className="h-12 w-12 mx-auto mb-4 text-theme-tertiary" />
          <p className="text-theme-secondary">
            You don't have permission to manage invitations in any projects.
          </p>
          <p className="text-sm text-theme-tertiary mt-2">
            Only project owners and admins can manage invitations.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {projects.map((project) => {
        const grouped = groupedInvitations[project.id] || { pending: [], accepted: [], rejected: [] };
        const totalInvitations = grouped.pending.length + grouped.accepted.length + grouped.rejected.length;

        if (totalInvitations === 0) {
          return (
            <Card key={project.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-theme-primary">{project.name}</h3>
                </div>
              </div>
              <p className="text-sm text-theme-secondary py-4 text-center">
                No invitations for this project
              </p>
            </Card>
          );
        }

        return (
          <Card key={project.id} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-theme-primary">{project.name}</h3>
                <p className="text-sm text-theme-secondary mt-1">
                  {totalInvitations} invitation{totalInvitations !== 1 ? 's' : ''} total
                </p>
              </div>
            </div>

            {/* Pending Invitations */}
            {grouped.pending.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-theme-tertiary" />
                  <h4 className="text-sm font-medium text-theme-primary">
                    Pending ({grouped.pending.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {grouped.pending.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-elevation-1 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Mail className="h-4 w-4 text-theme-tertiary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-theme-primary truncate">
                            {invitation.email}
                          </p>
                          <p className="text-xs text-theme-tertiary">
                            Invited as {invitation.role} • {new Date(invitation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvitation(project.id, invitation.id)}
                        isLoading={revokeInvitationMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted Invitations */}
            {grouped.accepted.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-status-success" />
                  <h4 className="text-sm font-medium text-theme-primary">
                    Accepted ({grouped.accepted.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {grouped.accepted.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-elevation-1 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Mail className="h-4 w-4 text-theme-tertiary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-theme-primary truncate">
                            {invitation.email}
                          </p>
                          <p className="text-xs text-theme-tertiary">
                            Accepted on {invitation.acceptedAt ? new Date(invitation.acceptedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">Accepted</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected/Revoked Invitations */}
            {grouped.rejected.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-4 w-4 text-status-danger" />
                  <h4 className="text-sm font-medium text-theme-primary">
                    Rejected/Revoked ({grouped.rejected.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {grouped.rejected.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-elevation-1 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Mail className="h-4 w-4 text-theme-tertiary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-theme-primary truncate">
                            {invitation.email}
                          </p>
                          <p className="text-xs text-theme-tertiary">
                            {invitation.status === 'REVOKED' ? 'Cancelled' : 'Expired'} • {new Date(invitation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default">
                        {invitation.status === 'REVOKED' ? 'Cancelled' : 'Expired'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

