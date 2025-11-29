import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsService } from '../services/workflows';
import type { CreateWorkflowRequest } from '../types';

export const useWorkflows = (userId?: string) => {
    return useQuery({
        queryKey: ['workflows', userId],
        queryFn: () => workflowsService.listWorkflows(),
        enabled: !!userId,
        staleTime: 30000,
    });
};

export const useCreateWorkflow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateWorkflowRequest) => workflowsService.createWorkflow(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            // Invalidate home page workflows query
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};
