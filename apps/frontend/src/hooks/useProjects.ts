import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../services/projects';
import { updateProjectsListCache } from '../utils/queryInvalidation';
import type { CreateProjectRequest, Project } from '../types';

interface UseProjectsOptions {
    search?: string;
    includeArchived?: boolean;
    enabled?: boolean;
}

export const useProjects = ({ search, includeArchived = false, enabled = true }: UseProjectsOptions = {}) => {
    return useQuery({
        queryKey: ['projects', search, includeArchived],
        queryFn: () => projectsService.listProjects({
            search: search || undefined,
            includeArchived,
        }),
        placeholderData: (previousData) => previousData,
        enabled,
        staleTime: 60 * 1000, // 1 minute - projects list changes moderately
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProjectRequest) => projectsService.createProject(data),
        onMutate: async (data) => {
            // Cancel all project queries to prevent race conditions
            await queryClient.cancelQueries({ queryKey: ['projects'], exact: false });
            
            // Store previous data for rollback
            const previousQueries = queryClient.getQueriesData({ queryKey: ['projects'], exact: false });
            
            // Optimistically add project to all project list queries
            const optimisticProject: Project = {
                id: `temp-${Date.now()}`,
                name: data.name,
                description: data.description,
                createdBy: '', // Will be replaced by server response
                secretCount: 0,
                memberCount: 1,
                isArchived: false,
                currentUserRole: 'OWNER',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            // Update all project list queries (with any filters/search)
            updateProjectsListCache(queryClient, (projects) => [optimisticProject, ...projects]);
            
            return { previousQueries };
        },
        onError: (_err, _variables, context) => {
            // Rollback all queries to previous state
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSuccess: (data) => {
            // Update all project list queries with server response
            updateProjectsListCache(queryClient, (projects) =>
                projects.map((p: Project) => 
                    p.id?.toString().startsWith('temp-') ? data : p
                )
            );
            
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] });
            queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
            queryClient.invalidateQueries({ queryKey: ['teams'] }); // Teams might have project counts
        },
    });
};
