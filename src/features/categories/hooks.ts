import { useQueryClient } from '@tanstack/react-query';

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '@/domain';
import type { Category } from '@/domain/types';
import {
  useAppMutation,
  useQuery,
  useQueryState,
  type MutationState,
  type QueryState,
} from '@/features/query-state';
import { queryKeys } from '@/lib/query-keys';
import { invalidateAfterCategoryChange } from '@/providers/query-client';
import { getUseCaseDeps } from '@/services/database';

export function useCategories(): QueryState<Category[]> {
  const query = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => getCategories(await getUseCaseDeps()),
  });

  return useQueryState(query);
}

export function useCategoryTransactionCounts(): QueryState<
  Record<string, number>
> {
  const query = useQuery({
    queryKey: queryKeys.categoryTransactionCounts,
    queryFn: async () =>
      (await getUseCaseDeps()).transactions.countByCategory(),
  });

  return useQueryState(query);
}

export function useCreateCategory(): MutationState<Category, unknown> {
  const queryClient = useQueryClient();

  return useAppMutation({
    mutationFn: async input => createCategory(await getUseCaseDeps(), input),
    onSuccess: async () => {
      await invalidateAfterCategoryChange(queryClient);
    },
  });
}

export function useUpdateCategory(): MutationState<
  Category,
  { id: string; input: unknown }
> {
  const queryClient = useQueryClient();

  return useAppMutation({
    mutationFn: async ({ id, input }) =>
      updateCategory(await getUseCaseDeps(), id, input),
    onSuccess: async () => {
      await invalidateAfterCategoryChange(queryClient);
    },
  });
}

export function useDeleteCategory(): MutationState<void, string> {
  const queryClient = useQueryClient();

  return useAppMutation({
    mutationFn: async id => {
      await deleteCategory(await getUseCaseDeps(), id);
    },
    onSuccess: async () => {
      await invalidateAfterCategoryChange(queryClient);
    },
  });
}
