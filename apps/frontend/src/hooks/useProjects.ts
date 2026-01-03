import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../services/projects';
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
            await queryClient.cancelQueries({ queryKey: ['projects'] });
            const previous = queryClient.getQueryData(['projects']);
            
            // Optimistically add project
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
            
            queryClient.setQueryData(['projects'], (old: any) => {
                if (!old?.content) return old;
                return {
                    ...old,
                    content: [optimisticProject, ...old.content],
                };
            });
            
            return { previous };
        },
        onError: (_err, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['projects'], context.previous);
            }
        },
        onSuccess: (data) => {
            // Update with server response
            queryClient.setQueryData(['projects'], (old: any) => {
                if (!old?.content) return old;
                return {
                    ...old,
                    content: old.content.map((p: Project) => 
                        p.id?.toString().startsWith('temp-') ? data : p
                    ),
                };
            });
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] });
            queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
        },
    });
};
