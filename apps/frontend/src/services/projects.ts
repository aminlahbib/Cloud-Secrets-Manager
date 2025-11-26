import api from './api';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectStats,
  PaginatedResponse 
} from '../types';

export interface ProjectsListParams {
  page?: number;
  size?: number;
  search?: string;
  includeArchived?: boolean;
}

export const projectsService = {
  /**
   * List all accessible projects for the current user
   */
  async listProjects(params: ProjectsListParams = {}): Promise<PaginatedResponse<Project>> {
    const { data } = await api.get('/api/projects', { params });
    return data;
  },

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<Project> {
    const { data } = await api.get(`/api/projects/${id}`);
    return data;
  },

  /**
   * Get project statistics
   */
  async getProjectStats(id: string): Promise<ProjectStats> {
    const { data } = await api.get(`/api/projects/${id}/stats`);
    return data;
  },

  /**
   * Create a new project
   */
  async createProject(request: CreateProjectRequest): Promise<Project> {
    const { data } = await api.post('/api/projects', request);
    return data;
  },

  /**
   * Update an existing project
   */
  async updateProject(id: string, request: UpdateProjectRequest): Promise<Project> {
    const { data } = await api.put(`/api/projects/${id}`, request);
    return data;
  },

  /**
   * Archive a project (soft delete)
   */
  async archiveProject(id: string): Promise<void> {
    await api.delete(`/api/projects/${id}`);
  },

  /**
   * Permanently delete a project
   */
  async deleteProjectPermanently(id: string): Promise<void> {
    await api.delete(`/api/projects/${id}`, { params: { permanent: true } });
  },

  /**
   * Restore an archived project
   */
  async restoreProject(id: string): Promise<Project> {
    const { data } = await api.post(`/api/projects/${id}/restore`);
    return data;
  },

  /**
   * List archived projects
   */
  async listArchivedProjects(): Promise<Project[]> {
    const { data } = await api.get('/api/projects/archived');
    return data;
  },

  /**
   * Leave a project
   */
  async leaveProject(id: string): Promise<void> {
    await api.post(`/api/projects/${id}/leave`);
  },
};

