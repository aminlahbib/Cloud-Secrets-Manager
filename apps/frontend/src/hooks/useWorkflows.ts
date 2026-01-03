import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsService } from '../services/workflows';
import type { CreateWorkflowRequest, UpdateWorkflowRequest, Workflow } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useWorkflows = (userId?: string) => {
    return useQuery({
        queryKey: ['workflows', userId],
        queryFn: () => workflowsService.listWorkflows(),
        enabled: !!userId,
        staleTime: 2 * 60 * 1000, // 2 minutes - workflows rarely change
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
    const { user } = useAuth();

    return useMutation({
        mutationFn: (data: CreateWorkflowRequest) => workflowsService.createWorkflow(data),
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['workflows'] });
            const previous = queryClient.getQueryData(['workflows']);
            
            // Optimistically add workflow
            const optimisticWorkflow: Workflow = {
                id: `temp-${Date.now()}`,
                userId: user?.id || '', // Will be replaced by server response
                name: data.name,
                description: data.description,
                isDefault: false, // Will be replaced by server response
                displayOrder: 0, // Will be replaced by server response
                projects: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            queryClient.setQueryData(['workflows'], (old: Workflow[] | undefined) => {
                return old ? [...old, optimisticWorkflow] : [optimisticWorkflow];
            });
            
            return { previous };
        },
        onError: (_err, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['workflows'], context.previous);
            }
        },
        onSuccess: (data) => {
            // Update with server response
            queryClient.setQueryData(['workflows'], (old: Workflow[] | undefined) => {
                if (!old) return [data];
                return old.map(w => w.id?.toString().startsWith('temp-') ? data : w);
            });
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};

export const useUpdateWorkflow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateWorkflowRequest }) =>
            workflowsService.updateWorkflow(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ['workflows'] });
            await queryClient.cancelQueries({ queryKey: ['workflow', id] });
            const previousWorkflows = queryClient.getQueryData(['workflows']);
            const previousWorkflow = queryClient.getQueryData(['workflow', id]);
            
            // Optimistically update in workflows list
            queryClient.setQueryData(['workflows'], (old: Workflow[] | undefined) => {
                if (!old) return old;
                return old.map(w => w.id === id ? { ...w, ...data } : w);
            });
            
            // Optimistically update individual workflow
            queryClient.setQueryData(['workflow', id], (old: Workflow | undefined) => {
                if (!old) return old;
                return { ...old, ...data };
            });
            
            return { previousWorkflows, previousWorkflow };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousWorkflows) {
                queryClient.setQueryData(['workflows'], context.previousWorkflows);
            }
            if (context?.previousWorkflow) {
                queryClient.setQueryData(['workflow', _variables.id], context.previousWorkflow);
            }
        },
        onSuccess: (data, variables) => {
            // Update with server response
            queryClient.setQueryData(['workflow', variables.id], data);
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};

export const useDeleteWorkflow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => workflowsService.deleteWorkflow(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['workflows'] });
            const previous = queryClient.getQueryData(['workflows']);
            
            // Optimistically remove workflow
            queryClient.setQueryData(['workflows'], (old: Workflow[] | undefined) => {
                if (!old) return old;
                return old.filter(w => w.id !== id);
            });
            
            return { previous };
        },
        onError: (_err, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['workflows'], context.previous);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};
