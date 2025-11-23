import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  primaryRole: string;
  roles?: string[];
  permissions?: string[];
  lastLoginAt?: string;
  createdAt?: string;
  disabled?: boolean;
  emailVerified?: boolean;
}

export const adminService = {
  // List all users
  async listUsers(): Promise<AdminUser[]> {
    const { data } = await api.get('/api/admin/users');
    return data;
  },

  // Update user role
  async updateUserRole(userId: string, role: string): Promise<void> {
    await api.put(`/api/admin/users/${userId}/role`, { role });
  },

  // Update user permissions
  async updateUserPermissions(userId: string, permissions: string[]): Promise<void> {
    await api.put(`/api/admin/users/${userId}/permissions`, { permissions });
  },
};

