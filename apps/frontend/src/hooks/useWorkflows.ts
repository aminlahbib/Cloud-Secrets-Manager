import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsService } from '../services/workflows';
import type { CreateWorkflowRequest, UpdateWorkflowRequest } from '../types';

export const useWorkflows = (userId?: string) => {
    return useQuery({
        queryKey: ['workflows', userId],
        queryFn: () => workflowsService.listWorkflows(),
        enabled: !!userId,
        staleTime: 30000,
    });
};

export const useWorkflow = (workflowId?: string) => {
    return useQuery({
        queryKey: ['workflow', workflowId],
        queryFn: () => workflowsService.getWorkflow(workflowId!),
        enabled: !!workflowId,
    });
};

export const useCreateWorkflow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateWorkflowRequest) => workflowsService.createWorkflow(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};

export const useUpdateWorkflow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateWorkflowRequest }) =>
            workflowsService.updateWorkflow(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            queryClient.invalidateQueries({ queryKey: ['workflow', variables.id] });
        },
    });
};

export const useDeleteWorkflow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => workflowsService.deleteWorkflow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};
