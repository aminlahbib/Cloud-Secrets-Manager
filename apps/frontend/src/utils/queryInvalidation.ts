/**
 * Query invalidation utilities
 * Centralized functions to batch query invalidations and reduce code duplication
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Invalidate all project-related queries
 * Use this helper to avoid repetitive invalidation calls
 */
export const invalidateProjectQueries = (
  queryClient: QueryClient,
  projectId: string,
  userId?: string
) => {
  // Project-specific queries
  queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
  queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
  queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
  queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });

  // User-specific queries (if userId provided)
  if (userId) {
    queryClient.invalidateQueries({ queryKey: ['projects', 'recent', userId] });
    queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
  }

  // Global project list
  queryClient.invalidateQueries({ queryKey: ['projects'] });
};

/**
 * Invalidate workflow-related queries
 */
export const invalidateWorkflowQueries = (
  queryClient: QueryClient,
  userId?: string
) => {
  queryClient.invalidateQueries({ queryKey: ['workflows'] });
  queryClient.invalidateQueries({ queryKey: ['projects'] });
  
  if (userId) {
    queryClient.invalidateQueries({ queryKey: ['workflows', userId] });
    queryClient.invalidateQueries({ queryKey: ['projects', 'recent', userId] });
  }
};

/**
 * Invalidate activity-related queries
 */
export const invalidateActivityQueries = (
  queryClient: QueryClient,
  projectId?: string,
  userId?: string
) => {
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
    queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
  }
  
  if (userId) {
    queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
  }
  
  queryClient.invalidateQueries({ queryKey: ['activity'] });
};

