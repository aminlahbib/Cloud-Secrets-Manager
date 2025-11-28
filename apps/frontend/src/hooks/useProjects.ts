import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../services/projects';
import type { CreateProjectRequest } from '../types';

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
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProjectRequest) => projectsService.createProject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};
