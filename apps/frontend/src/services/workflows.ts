import api from './api';
import type { 
  Workflow, 
  CreateWorkflowRequest, 
  UpdateWorkflowRequest,
  ReorderWorkflowsRequest 
} from '../types';

export const workflowsService = {
  /**
   * List all workflows for the current user
   */
  async listWorkflows(): Promise<Workflow[]> {
    const { data } = await api.get('/api/workflows');
    return data;
  },

  /**
   * Get a single workflow by ID
   */
  async getWorkflow(id: string): Promise<Workflow> {
    const { data } = await api.get(`/api/workflows/${id}`);
    return data;
  },

  /**
   * Create a new workflow
   */
  async createWorkflow(request: CreateWorkflowRequest): Promise<Workflow> {
    const { data } = await api.post('/api/workflows', request);
    return data;
  },

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: string, request: UpdateWorkflowRequest): Promise<Workflow> {
    const { data } = await api.put(`/api/workflows/${id}`, request);
    return data;
  },

  /**
   * Delete a workflow (projects are NOT deleted, just unlinked)
   */
  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/api/workflows/${id}`);
  },

  /**
   * Reorder workflows
   */
  async reorderWorkflows(request: ReorderWorkflowsRequest): Promise<void> {
    await api.put('/api/workflows/reorder', request);
  },

  /**
   * Add a project to a workflow
   */
  async addProjectToWorkflow(workflowId: string, projectId: string): Promise<void> {
    await api.post(`/api/workflows/${workflowId}/projects/${projectId}`);
  },

  /**
   * Remove a project from a workflow
   */
  async removeProjectFromWorkflow(workflowId: string, projectId: string): Promise<void> {
    await api.delete(`/api/workflows/${workflowId}/projects/${projectId}`);
  },

  /**
   * Move a project to a different workflow
   */
  async moveProjectToWorkflow(
    projectId: string, 
    fromWorkflowId: string, 
    toWorkflowId: string
  ): Promise<void> {
    await api.delete(`/api/workflows/${fromWorkflowId}/projects/${projectId}`);
    await api.post(`/api/workflows/${toWorkflowId}/projects/${projectId}`);
  },
};

