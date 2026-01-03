/**
 * Query invalidation utilities
 * Centralized functions to batch query invalidations and reduce code duplication
 * Includes immediate cache update functions for real-time UI updates
 */

import { QueryClient } from '@tanstack/react-query';
import type { Project, ProjectMember, Secret, Team, TeamMember } from '../types';

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

/**
 * Clear user-specific queries while preserving audit/activity data
 * This is used on logout to clear sensitive user data but keep audit logs
 * which are persistent and should not be lost across sessions
 */
export const clearUserSpecificQueries = (queryClient: QueryClient) => {
  // Clear user-specific queries
  queryClient.removeQueries({ queryKey: ['user'] });
  queryClient.removeQueries({ queryKey: ['user-preferences'] });
  queryClient.removeQueries({ queryKey: ['notifications'] });
  queryClient.removeQueries({ queryKey: ['projects', 'recent'] });
  queryClient.removeQueries({ queryKey: ['activity', 'recent'] });
  queryClient.removeQueries({ queryKey: ['workflows'] });
  queryClient.removeQueries({ queryKey: ['admin-users'] });
  queryClient.removeQueries({ queryKey: ['admin-stats'] });
  
  // Clear project-specific queries that contain sensitive user data
  queryClient.removeQueries({ queryKey: ['project-secrets'] });
  queryClient.removeQueries({ queryKey: ['project-members'] });
  queryClient.removeQueries({ queryKey: ['project'] });
  // Note: We clear ['projects'] but it will be re-fetched on login
  // Audit queries depend on projects, but they will work once projects are re-fetched
  queryClient.removeQueries({ queryKey: ['projects'] });
  queryClient.removeQueries({ queryKey: ['teams'] });
  queryClient.removeQueries({ queryKey: ['team'] });
  
  // NOTE: We intentionally preserve audit/activity queries:
  // - ['activity', 'all-projects', ...] - Activity page queries (preserved)
  // - ['project-activity', projectId, ...] - Project activity queries (preserved)
  // - ['project-activity-analytics', projectId, ...] - Project analytics queries (preserved)
  // - ['teams', teamId, 'activity', ...] - Team activity queries (preserved)
  // These are based on projects/teams, not user sessions, and should persist.
  // When user logs back in, projects will be re-fetched and audit queries will continue seamlessly.
};

/**
 * Immediately update project cache with new data
 */
export const updateProjectCache = (
  queryClient: QueryClient,
  projectId: string,
  updates: Partial<Project>
): void => {
  queryClient.setQueryData<Project>(['project', projectId], (old) => {
    if (!old) return old;
    return { ...old, ...updates };
  });
};

/**
 * Immediately update member list in cache
 */
export const updateMemberCache = (
  queryClient: QueryClient,
  projectId: string,
  updater: (members: ProjectMember[]) => ProjectMember[]
): void => {
  queryClient.setQueryData(['project-members', projectId], (old: any) => {
    if (!old) return old;
    const members = Array.isArray(old) ? old : old.content || [];
    const updated = updater(members);
    return Array.isArray(old) ? updated : { ...old, content: updated };
  });
};

/**
 * Immediately update secret list in cache
 */
export const updateSecretCache = (
  queryClient: QueryClient,
  projectId: string,
  updater: (secrets: Secret[]) => Secret[]
): void => {
  queryClient.setQueryData(['project-secrets', projectId], (old: any) => {
    if (!old?.content) return old;
    return {
      ...old,
      content: updater(old.content),
    };
  });
};

/**
 * Immediately update team cache with new data
 */
export const updateTeamCache = (
  queryClient: QueryClient,
  teamId: string,
  updates: Partial<Team>
): void => {
  queryClient.setQueryData<Team>(['teams', teamId], (old) => {
    if (!old) return old;
    return { ...old, ...updates };
  });
};

/**
 * Immediately update team member list in cache
 */
export const updateTeamMemberCache = (
  queryClient: QueryClient,
  teamId: string,
  updater: (members: TeamMember[]) => TeamMember[]
): void => {
  queryClient.setQueryData(['teams', teamId, 'members'], (old: any) => {
    if (!old) return old;
    const members = Array.isArray(old) ? old : old.content || [];
    const updated = updater(members);
    return Array.isArray(old) ? updated : { ...old, content: updated };
  });
};

/**
 * Smart invalidation - only invalidate if query exists
 * Reduces unnecessary refetches by checking if query state exists
 */
export const smartInvalidate = (
  queryClient: QueryClient,
  queryKey: unknown[],
  options?: { refetchType?: 'active' | 'inactive' | 'all' | 'none' }
): void => {
  const state = queryClient.getQueryState(queryKey);
  if (state) {
    queryClient.invalidateQueries({ 
      queryKey,
      refetchType: options?.refetchType || 'active',
    });
  }
};

