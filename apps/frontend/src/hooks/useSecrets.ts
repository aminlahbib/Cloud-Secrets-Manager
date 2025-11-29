import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { secretsService } from '../services/secrets';
import type { SecretFormValues } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useProjectSecret = (projectId: string, secretKey: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['project-secret', projectId, secretKey],
        queryFn: () => secretsService.getProjectSecret(projectId, secretKey),
        enabled: enabled && !!projectId && !!secretKey,
    });
};

export const useSaveSecret = (projectId: string, isEditMode: boolean) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (payload: SecretFormValues) => {
            if (!projectId) throw new Error('Project ID is required');

            const { key, value, expiresAt, description } = payload;

            let result;
            if (isEditMode) {
                result = await secretsService.updateProjectSecret(projectId, key, {
                    value,
                    description,
                    // Format as ISO string without milliseconds to ensure backend compatibility
                    expiresAt: expiresAt ? expiresAt.toISOString().split('.')[0] + 'Z' : undefined,
                });
            } else {
                result = await secretsService.createProjectSecret(projectId, {
                    secretKey: key,
                    value,
                    description,
                    expiresAt: expiresAt ? expiresAt.toISOString().split('.')[0] + 'Z' : undefined,
                });
            }

            return result;
        },
        onSuccess: (result, variables) => {
            const targetKey = result.key || result.secretKey || variables.key;
            // Invalidate secret-related queries
            queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-secret', projectId, targetKey] });
            // Invalidate activity and analytics
            queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
            // Invalidate home page queries
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
                queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
            }
            // Invalidate projects list (for secret count updates)
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });
};
