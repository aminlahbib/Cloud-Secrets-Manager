import api from './api';
import type { 
  Team, 
  CreateTeamRequest, 
  UpdateTeamRequest,
  TeamMember,
  TeamMemberRequest,
  UpdateTeamMemberRoleRequest,
  BulkInviteRequest,
  TeamProject
} from '../types';

export const teamsService = {
  /**
   * List all teams the current user is a member of
   */
  async listTeams(): Promise<Team[]> {
    const { data } = await api.get<Team[]>('/api/teams');
    return data;
  },

  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<Team> {
    const { data } = await api.get<Team>(`/api/teams/${teamId}`);
    return data;
  },

  /**
   * Create a new team
   */
  async createTeam(request: CreateTeamRequest): Promise<Team> {
    const { data } = await api.post<Team>('/api/teams', request);
    return data;
  },

  /**
   * Update team
   */
  async updateTeam(teamId: string, request: UpdateTeamRequest): Promise<Team> {
    const { data } = await api.put<Team>(`/api/teams/${teamId}`, request);
    return data;
  },

  /**
   * Delete team (soft delete)
   */
  async deleteTeam(teamId: string): Promise<void> {
    await api.delete(`/api/teams/${teamId}`);
  },

  /**
   * List team members
   */
  async listTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data } = await api.get<TeamMember[]>(`/api/teams/${teamId}/members`);
    return data;
  },

  /**
   * Add member to team
   */
  async addTeamMember(teamId: string, request: TeamMemberRequest): Promise<TeamMember> {
    const { data } = await api.post<TeamMember>(`/api/teams/${teamId}/members`, request);
    return data;
  },

  /**
   * Remove member from team
   */
  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    await api.delete(`/api/teams/${teamId}/members/${memberId}`);
  },

  /**
   * Update member role
   */
  async updateMemberRole(
    teamId: string, 
    memberId: string, 
    request: UpdateTeamMemberRoleRequest
  ): Promise<TeamMember> {
    const { data } = await api.put<TeamMember>(
      `/api/teams/${teamId}/members/${memberId}/role`, 
      request
    );
    return data;
  },

  /**
   * Bulk invite members
   */
  async bulkInviteMembers(teamId: string, request: BulkInviteRequest): Promise<TeamMember[]> {
    const { data } = await api.post<TeamMember[]>(
      `/api/teams/${teamId}/members/bulk-invite`, 
      request
    );
    return data;
  },

  /**
   * List team projects
   */
  async listTeamProjects(teamId: string): Promise<TeamProject[]> {
    const { data } = await api.get<TeamProject[]>(`/api/teams/${teamId}/projects`);
    return data;
  },

  /**
   * Add project to team
   */
  async addProjectToTeam(teamId: string, projectId: string): Promise<TeamProject> {
    const { data } = await api.post<TeamProject>(
      `/api/teams/${teamId}/projects/${projectId}`
    );
    return data;
  },

  /**
   * Remove project from team
   */
  async removeProjectFromTeam(teamId: string, projectId: string): Promise<void> {
    await api.delete(`/api/teams/${teamId}/projects/${projectId}`);
  },

  /**
   * Transfer team ownership to another member
   */
  async transferOwnership(teamId: string, request: { newOwnerUserId: string }): Promise<void> {
    await api.post(`/api/teams/${teamId}/transfer-ownership`, request);
  },
};

