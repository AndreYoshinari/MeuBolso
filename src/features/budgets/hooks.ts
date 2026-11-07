import { useQueryClient } from '@tanstack/react-query';

import {
  createBudget,
  deleteBudget,
  getBudgetsByPeriod,
  getCategories,
  getTransactionsByPeriod,
  updateBudget,
} from '@/domain';
import type { Budget } from '@/domain/types';
import { budgetCards, type BudgetCard } from '@/features/budgets/presentation';
import {
  useAppMutation,
  useQuery,
  useQueryState,
  type MutationState,
  type QueryState,
} from '@/features/query-state';
import { ValidationError } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';
import { parseYearMonth } from '@/lib/period';
import { invalidateAfterBudgetChange } from '@/providers/query-client';
import { getUseCaseDeps } from '@/services/database';

export function useBudgets(yearMonth: string): QueryState<BudgetCard[]> {
  const query = useQuery({
    queryKey: queryKeys.budgets(yearMonth),
    queryFn: async () => {
      const deps = await getUseCaseDeps();
      const period = requireYearMonth(yearMonth);
      const [budgets, categories, transactions] = await Promise.all([
        getBudgetsByPeriod(deps, period),
        getCategories(deps),
        getTransactionsByPeriod(deps, period),
      ]);

      return budgetCards(budgets, transactions, categories);
    },
  });

  return useQueryState(query);
}

export function useCreateBudget(): MutationState<Budget, unknown> {
  const queryClient = useQueryClient();

  return useAppMutation({
    mutationFn: async input => createBudget(await getUseCaseDeps(), input),
    onSuccess: async () => {
      await invalidateAfterBudgetChange(queryClient);
    },
  });
}

export function useUpdateBudget(): MutationState<
  Budget,
  { id: string; input: unknown }
> {
  const queryClient = useQueryClient();

  return useAppMutation({
    mutationFn: async ({ id, input }) =>
      updateBudget(await getUseCaseDeps(), id, input),
    onSuccess: async () => {
      await invalidateAfterBudgetChange(queryClient);
    },
  });
}

export function useDeleteBudget(): MutationState<void, string> {
  const queryClient = useQueryClient();

  return useAppMutation({
    mutationFn: async id => {
      await deleteBudget(await getUseCaseDeps(), id);
    },
    onSuccess: async () => {
      await invalidateAfterBudgetChange(queryClient);
    },
  });
}

function requireYearMonth(value: string) {
  const period = parseYearMonth(value);

  if (!period) {
    throw new ValidationError([
      { field: 'period', message: 'Informe um mês e um ano válidos.' },
    ]);
  }

  return period;
}
