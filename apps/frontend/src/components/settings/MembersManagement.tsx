import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '../../services/projects';
import { membersService } from '../../services/members';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { Crown, Shield, Mail, Users } from 'lucide-react';
import type { Project, ProjectMember, ProjectRole } from '../../types';

interface MembersManagementProps {
  userId?: string;
}

export const MembersManagement: React.FC<MembersManagementProps> = ({ userId }) => {
  // Fetch all projects where user is OWNER or ADMIN
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['user-projects'],
    queryFn: async () => {
      const response = await projectsService.listProjects();
      const allProjects = response.content || [];
      return allProjects.filter(
        (p: Project) => p.currentUserRole === 'OWNER' || p.currentUserRole === 'ADMIN'
      );
    },
    enabled: !!userId,
  });

  // Fetch members for each project
  const projectMembersQueries = useQuery({
    queryKey: ['all-project-members', projects?.map((p) => p.id)],
    queryFn: async () => {
      if (!projects) return {};
      const membersMap: Record<string, ProjectMember[]> = {};
      await Promise.all(
        projects.map(async (project) => {
          try {
            const members = await membersService.listMembers(project.id);
            membersMap[project.id] = members;
          } catch (error) {
            console.error(`Failed to fetch members for project ${project.id}:`, error);
            membersMap[project.id] = [];
          }
        })
      );
      return membersMap;
    },
    enabled: !!projects && projects.length > 0,
  });

  const membersByProject = projectMembersQueries.data || {};

  // Group members by role for each project
  const roleCounts = useMemo(() => {
    const counts: Record<string, Record<ProjectRole, number>> = {};
    Object.entries(membersByProject).forEach(([projectId, members]) => {
      counts[projectId] = {
        OWNER: 0,
        ADMIN: 0,
        MEMBER: 0,
        VIEWER: 0,
      };
      members.forEach((member) => {
        counts[projectId][member.role] = (counts[projectId][member.role] || 0) + 1;
      });
    });
    return counts;
  }, [membersByProject]);

  const getRoleIcon = (role: ProjectRole) => {
    if (role === 'OWNER') return <Crown className="h-3 w-3" />;
    if (role === 'ADMIN') return <Shield className="h-3 w-3" />;
    return null;
  };

  if (isLoading || projectMembersQueries.isLoading) {
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
          <Users className="h-12 w-12 mx-auto mb-4 text-theme-tertiary" />
          <p className="text-theme-secondary">
            You don't have permission to manage members in any projects.
          </p>
          <p className="text-sm text-theme-tertiary mt-2">
            Only project owners and admins can manage members.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {projects.map((project) => {
        const members = membersByProject[project.id] || [];
        const counts = roleCounts[project.id] || { OWNER: 0, ADMIN: 0, MEMBER: 0, VIEWER: 0 };
        const canManage = project.currentUserRole === 'OWNER' || project.currentUserRole === 'ADMIN';

        return (
          <Card key={project.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-theme-primary">{project.name}</h3>
                <p className="text-sm text-theme-secondary mt-1">
                  {project.description || 'No description'}
                </p>
              </div>
              <Badge variant={project.currentUserRole === 'OWNER' ? 'owner-admin' : 'info'}>
                {project.currentUserRole}
              </Badge>
            </div>

            {/* Role Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-elevation-1 rounded-lg">
              {(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as ProjectRole[]).map((role) => (
                <div key={role} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getRoleIcon(role)}
                    <span className="text-xs font-medium text-theme-secondary">{role}</span>
                  </div>
                  <div className="text-2xl font-bold text-theme-primary">{counts[role] || 0}</div>
                </div>
              ))}
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-theme-primary mb-3">Members</h4>
              {members.length === 0 ? (
                <p className="text-sm text-theme-secondary py-4 text-center">
                  No members in this project
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-elevation-1 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-elevation-2 text-theme-primary font-medium flex-shrink-0">
                          <span>
                            {(member.user?.displayName || member.user?.email || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-theme-primary truncate">
                            {member.user?.displayName || member.user?.email || 'Unknown'}
                          </p>
                          <p className="text-xs text-theme-tertiary flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3" />
                            {member.user?.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant={member.role === 'OWNER' || member.role === 'ADMIN' ? 'owner-admin' : 'default'}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1">{member.role}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!canManage && (
              <div className="mt-4 p-3 bg-elevation-1 rounded-lg text-xs text-theme-tertiary">
                You have read-only access to this project's members.
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

