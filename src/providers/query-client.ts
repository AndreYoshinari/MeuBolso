import { QueryClient } from '@tanstack/react-query';

import { ValidationError } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !(error instanceof ValidationError) && failureCount < 1,
        networkMode: 'always',
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
        networkMode: 'always',
      },
    },
  });
}

export async function invalidateAfterTransactionChange(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['transaction'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['charts'] }),
  ]);
}

export async function invalidateAfterCategoryChange(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['charts'] }),
  ]);
}

export async function invalidateAfterBudgetChange(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['charts'] }),
  ]);
}
