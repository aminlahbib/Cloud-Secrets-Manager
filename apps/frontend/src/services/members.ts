import api from './api';
import type { 
  ProjectMember, 
  InviteMemberRequest, 
  UpdateMemberRoleRequest,
  TransferOwnershipRequest,
  ProjectInvitation 
} from '../types';

export const membersService = {
  /**
   * List all members of a project
   */
  async listMembers(projectId: string): Promise<ProjectMember[]> {
    const { data } = await api.get(`/api/projects/${projectId}/members`);
    return data;
  },

  /**
   * Invite a member to a project (direct add or email invitation)
   */
  async inviteMember(projectId: string, request: InviteMemberRequest): Promise<ProjectMember | ProjectInvitation> {
    const { data } = await api.post(`/api/projects/${projectId}/members`, request);
    return data;
  },

  /**
   * Update a member's role
   */
  async updateMemberRole(
    projectId: string, 
    userId: string, 
    request: UpdateMemberRoleRequest
  ): Promise<ProjectMember> {
    const { data } = await api.put(`/api/projects/${projectId}/members/${userId}`, request);
    return data;
  },

  /**
   * Remove a member from a project
   */
  async removeMember(projectId: string, userId: string): Promise<void> {
    await api.delete(`/api/projects/${projectId}/members/${userId}`);
  },

  /**
   * Transfer ownership to another member
   */
  async transferOwnership(projectId: string, request: TransferOwnershipRequest): Promise<void> {
    await api.post(`/api/projects/${projectId}/transfer-ownership`, request);
  },

  /**
   * Get pending invitations for a project
   */
  async listPendingInvitations(projectId: string): Promise<ProjectInvitation[]> {
    const { data } = await api.get(`/api/projects/${projectId}/invitations`);
    return data;
  },

  /**
   * Revoke a pending invitation
   */
  async revokeInvitation(projectId: string, invitationId: string): Promise<void> {
    await api.delete(`/api/projects/${projectId}/invitations/${invitationId}`);
  },
};

