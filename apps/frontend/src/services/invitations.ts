import api from './api';
import type { ProjectInvitation } from '../types';

export const invitationsService = {
  /**
   * List pending invitations for the current user
   */
  async listMyInvitations(): Promise<ProjectInvitation[]> {
    const { data } = await api.get('/api/invitations');
    return data;
  },

  /**
   * Accept an invitation by token
   */
  async acceptInvitation(token: string): Promise<void> {
    await api.post(`/api/invitations/${token}/accept`);
  },

  /**
   * Decline an invitation by token
   */
  async declineInvitation(token: string): Promise<void> {
    await api.post(`/api/invitations/${token}/decline`);
  },
};

