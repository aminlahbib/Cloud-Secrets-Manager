import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { secretsService } from '../services/secrets';
import type { SecretFormValues, Secret } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { updateSecretCache, updateProjectCache } from '../utils/queryInvalidation';

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
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['project-secrets', projectId] });
            const previous = queryClient.getQueryData(['project-secrets', projectId]);
            
            if (isEditMode) {
                // Optimistically update existing secret
                updateSecretCache(queryClient, projectId, (secrets) =>
                    secrets.map(s => s.secretKey === variables.key ? {
                        ...s,
                        description: variables.description,
                        expiresAt: variables.expiresAt?.toISOString(),
                    } : s)
                );
            } else {
                // Optimistically add new secret
                const optimisticSecret: Secret = {
                    id: `temp-${Date.now()}`,
                    secretKey: variables.key,
                    description: variables.description || undefined,
                    expiresAt: variables.expiresAt?.toISOString(),
                    version: 1,
                    createdBy: user?.id || '', // Will be replaced by server response
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    expired: false,
                };
                updateSecretCache(queryClient, projectId, (secrets) => [...secrets, optimisticSecret]);
                
                // Update project secret count
                updateProjectCache(queryClient, projectId, {
                    secretCount: (queryClient.getQueryData(['project', projectId]) as any)?.secretCount + 1 || 1,
                });
            }
            
            return { previous };
        },
        onError: (_err, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['project-secrets', projectId], context.previous);
            }
        },
        onSuccess: (result, variables) => {
            const targetKey = result.key || result.secretKey || variables.key;
            
            // Update with server response
            if (isEditMode) {
                updateSecretCache(queryClient, projectId, (secrets) =>
                    secrets.map(s => s.secretKey === targetKey ? result : s)
                );
            } else {
                updateSecretCache(queryClient, projectId, (secrets) =>
                    secrets.map(s => s.secretKey === targetKey ? result : s)
                );
            }
            
            // Update individual secret cache
            queryClient.setQueryData(['project-secret', projectId, targetKey], result);
            
            // Refetch secret versions to show latest version
            queryClient.refetchQueries({ queryKey: ['project-secret-versions', projectId, targetKey] });
            
            // Invalidate related queries for consistency
            queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-activity-analytics', projectId] });
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
                queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
            }
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });
};
