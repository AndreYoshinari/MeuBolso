import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  deleteTransaction,
  getTransactionById,
  getTransactions,
  getTransactionsByPeriod,
  updateTransaction,
  createTransaction,
} from '@/domain';
import {
  useAppMutation,
  useQuery,
  useQueryState,
  type MutationState,
  type QueryState,
} from '@/features/query-state';
import { queryKeys } from '@/lib/query-keys';
import { periodFromCivilDate, type YearMonth } from '@/lib/period';
import {
  defaultTransactionFilters,
  hasTransactionSearchParams,
  parseTransactionSearchParams,
  selectTransactions,
  type TransactionFilters,
} from '@/lib/transaction-filters';
import { notifyBudgetPeriodSafely } from '@/services/notifications';
import { getUseCaseDeps } from '@/services/database';
import { useSessionStore } from '@/stores/session';
import { invalidateAfterTransactionChange } from '@/providers/query-client';
import type { Transaction } from '@/domain/types';

export function useTransactions(
  filters: TransactionFilters,
): QueryState<Transaction[]> {
  const query = useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: async () => {
      const deps = await getUseCaseDeps();
      const transactions = await transactionsFor(deps, filters);

      return selectTransactions(transactions, filters);
    },
  });

  return useQueryState(query);
}

export function useTransaction(id: string): QueryState<Transaction> {
  const query = useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: async () => getTransactionById(await getUseCaseDeps(), id),
  });

  return useQueryState(query);
}

export function useCreateTransaction(): MutationState<Transaction, unknown> {
  const queryClient = useQueryClient();

  return useAppMutation({
    mutationFn: async input => createTransaction(await getUseCaseDeps(), input),
    onSuccess: async transaction => {
      await invalidateAfterTransactionChange(queryClient);
      await notifyChangedPeriod(transaction.date);
    },
  });
}

export function useUpdateTransaction(): MutationState<
  Transaction,
  { id: string; input: unknown }
> {
  const queryClient = useQueryClient();

  return useAppMutation({
    mutationFn: async ({ id, input }) =>
      updateTransaction(await getUseCaseDeps(), id, input),
    onSuccess: async transaction => {
      await invalidateAfterTransactionChange(queryClient);
      await notifyChangedPeriod(transaction.date);
    },
  });
}

export function useDeleteTransaction(): MutationState<Transaction, string> {
  const queryClient = useQueryClient();

  return useAppMutation({
    mutationFn: async id => {
      const deps = await getUseCaseDeps();
      const current = await getTransactionById(deps, id);
      await deleteTransaction(deps, id);
      return current;
    },
    onSuccess: async transaction => {
      await invalidateAfterTransactionChange(queryClient);
      await notifyChangedPeriod(transaction.date);
    },
  });
}

export function useTransactionFilters(): {
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  clearFilters: () => void;
} {
  const params = useLocalSearchParams();
  const router = useRouter();
  const stored = useSessionStore(state => state.filters);
  const setStored = useSessionStore(state => state.setFilters);
  const clearStored = useSessionStore(state => state.clearFilters);
  const filters = useMemo(() => {
    if (hasTransactionSearchParams(params)) {
      return parseTransactionSearchParams(params, new Date());
    }

    return stored ?? defaultTransactionFilters(new Date());
  }, [params, stored]);

  return {
    filters,
    setFilters(next) {
      setStored(next);
      router.setParams({
        type: next.type ?? '',
        categoryId: next.categoryId ?? '',
        q: next.query ?? '',
        from: next.from,
        to: next.to,
      });
    },
    clearFilters() {
      clearStored();
      router.setParams({
        type: '',
        categoryId: '',
        q: '',
        from: '',
        to: '',
      });
    },
  };
}

async function transactionsFor(
  deps: Awaited<ReturnType<typeof getUseCaseDeps>>,
  filters: TransactionFilters,
): Promise<Transaction[]> {
  const from = periodFromCivilDate(filters.from);
  const to = periodFromCivilDate(filters.to);

  if (from && to && samePeriod(from, to)) {
    return getTransactionsByPeriod(deps, from);
  }

  return getTransactions(deps);
}

function samePeriod(left: YearMonth, right: YearMonth): boolean {
  return left.year === right.year && left.month === right.month;
}

async function notifyChangedPeriod(date: string): Promise<void> {
  const period = periodFromCivilDate(date);

  if (!period) {
    return;
  }

  const deps = await getUseCaseDeps();
  await notifyBudgetPeriodSafely({ repositories: deps, period });
}
