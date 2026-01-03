/**
 * Centralized mutation helpers for optimistic updates
 * Provides reusable patterns for immediate UI updates without waiting for server response
 */

import { QueryClient, UseMutationOptions } from '@tanstack/react-query';

/**
 * Optimistic update configuration for list operations
 */
export interface OptimisticListUpdate<T> {
  queryKey: unknown[];
  addItem?: (old: any, newItem: T) => any;
  removeItem?: (old: any, itemId: string) => any;
  updateItem?: (old: any, itemId: string, updates: Partial<T>) => any;
  getItemId: (item: T) => string;
}

/**
 * Optimistic update configuration for single item operations
 */
export interface OptimisticItemUpdate<T> {
  queryKey: unknown[];
  updateFn: (old: T | undefined, updates: Partial<T>) => T;
}

/**
 * Create optimistic mutation options for adding items to a list
 */
export function createOptimisticListAdd<T>(
  queryClient: QueryClient,
  config: OptimisticListUpdate<T>
): Pick<UseMutationOptions<T, Error, T, any>, 'onMutate' | 'onError' | 'onSuccess'> {
  return {
    onMutate: async (newItem: T) => {
      await queryClient.cancelQueries({ queryKey: config.queryKey });
      
      const previous = queryClient.getQueryData(config.queryKey);
      
      if (config.addItem) {
        queryClient.setQueryData(config.queryKey, (old: any) => {
          if (!old) return old;
          return config.addItem!(old, newItem);
        });
      }
      
      return { previous };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previous) {
        queryClient.setQueryData(config.queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      // Update with server response for accuracy
      queryClient.setQueryData(config.queryKey, (old: any) => {
        if (!old || !config.addItem) return old;
        // Remove optimistic item and add server response
        const itemId = config.getItemId(data);
        const filtered = old.content 
          ? { ...old, content: old.content.filter((item: T) => config.getItemId(item) !== itemId) }
          : old;
        return config.addItem(filtered, data);
      });
    },
  };
}

/**
 * Create optimistic mutation options for removing items from a list
 */
export function createOptimisticListRemove<T>(
  queryClient: QueryClient,
  config: OptimisticListUpdate<T>
): Pick<UseMutationOptions<void, Error, string, any>, 'onMutate' | 'onError' | 'onSuccess'> {
  return {
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey: config.queryKey });
      
      const previous = queryClient.getQueryData(config.queryKey);
      
      if (config.removeItem) {
        queryClient.setQueryData(config.queryKey, (old: any) => {
          if (!old) return old;
          return config.removeItem!(old, itemId);
        });
      }
      
      return { previous };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(config.queryKey, context.previous);
      }
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  };
}

/**
 * Create optimistic mutation options for updating items in a list
 */
export function createOptimisticListUpdate<T>(
  queryClient: QueryClient,
  config: OptimisticListUpdate<T>
): Pick<UseMutationOptions<T, Error, { itemId: string; updates: Partial<T> }, any>, 'onMutate' | 'onError' | 'onSuccess'> {
  return {
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: config.queryKey });
      
      const previous = queryClient.getQueryData(config.queryKey);
      
      if (config.updateItem) {
        queryClient.setQueryData(config.queryKey, (old: any) => {
          if (!old) return old;
          return config.updateItem!(old, itemId, updates);
        });
      }
      
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(config.queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(config.queryKey, (old: any) => {
        if (!old || !config.updateItem) return old;
        const itemId = config.getItemId(data);
        return config.updateItem(old, itemId, data);
      });
    },
  };
}

/**
 * Create optimistic mutation options for updating a single item
 */
export function createOptimisticItemUpdate<T>(
  queryClient: QueryClient,
  config: OptimisticItemUpdate<T>
): Pick<UseMutationOptions<T, Error, Partial<T>, any>, 'onMutate' | 'onError' | 'onSuccess'> {
  return {
    onMutate: async (updates: Partial<T>) => {
      await queryClient.cancelQueries({ queryKey: config.queryKey });
      
      const previous = queryClient.getQueryData<T>(config.queryKey);
      
      queryClient.setQueryData(config.queryKey, (old: T | undefined) => {
        return config.updateFn(old, updates);
      });
      
      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(config.queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(config.queryKey, data);
    },
  };
}

/**
 * Helper to immediately update query cache with new data
 */
export function updateQueryCache<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updater: (old: T | undefined) => T
): void {
  queryClient.setQueryData(queryKey, updater);
}

/**
 * Helper to update counts in cache (e.g., secretCount, memberCount)
 */
export function updateCountInCache(
  queryClient: QueryClient,
  queryKey: unknown[],
  field: string,
  delta: number
): void {
  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    const currentCount = old[field] || 0;
    return {
      ...old,
      [field]: Math.max(0, currentCount + delta),
    };
  });
}

