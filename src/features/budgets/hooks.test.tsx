import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createTestDeps } from '@/domain/testing/test-deps';
import { useBudgets, useCreateBudget } from '@/features/budgets/hooks';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from '@/features/transactions/hooks';
import { createAppQueryClient } from '@/providers/query-client';
import type { UseCaseDeps } from '@/services/database';

const mockHolder: { deps: UseCaseDeps | null } = { deps: null };

jest.mock('@/services/database', () => ({
  getUseCaseDeps: async () => {
    if (!mockHolder.deps) {
      throw new Error('deps ausentes');
    }

    return mockHolder.deps;
  },
}));

jest.mock('@/services/notifications', () => ({
  notifyBudgetPeriodSafely: jest.fn(async () => undefined),
}));

const food = {
  id: 'food',
  name: 'Alimentação',
  icon: 'cafe',
  color: '#FF6B7A',
  type: 'expense' as const,
  isDefault: true,
};

function renderQuery() {
  const client = createAppQueryClient();
  client.setDefaultOptions({
    queries: { retry: false, networkMode: 'always', gcTime: 0 },
    mutations: { retry: false, networkMode: 'always', gcTime: 0 },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  mockHolder.deps = createTestDeps();
});

test('refreshes the spent amount after an expense changes', async () => {
  await mockHolder.deps?.categories.save(food);
  const { wrapper } = renderQuery();
  const list = await renderHook(() => useBudgets('2026-03'), { wrapper });
  const createBudget = await renderHook(() => useCreateBudget(), { wrapper });

  await act(async () => {
    await createBudget.result.current?.execute({
      categoryId: 'food',
      amountCents: 10_000,
      month: 3,
      year: 2026,
    });
  });

  await waitFor(() => {
    expect(list.result.current?.data?.[0]?.spentCents).toBe(0);
  });

  const create = await renderHook(() => useCreateTransaction(), { wrapper });
  let transactionId = '';

  await act(async () => {
    const created = await create.result.current?.execute({
      description: 'Mercado',
      amountCents: 8000,
      type: 'expense',
      categoryId: 'food',
      date: '2026-03-10',
      notes: '',
    });
    transactionId = created?.id ?? '';
  });

  await waitFor(() => {
    expect(list.result.current?.data?.[0]).toMatchObject({
      spentCents: 8000,
      remainingCents: 2000,
      basisPoints: 8000,
      level: 'warning',
    });
  });

  const update = await renderHook(() => useUpdateTransaction(), { wrapper });

  await act(async () => {
    await update.result.current?.execute({
      id: transactionId,
      input: {
        description: 'Mercado',
        amountCents: 12_000,
        type: 'expense',
        categoryId: 'food',
        date: '2026-03-10',
        notes: '',
      },
    });
  });

  await waitFor(() => {
    expect(list.result.current?.data?.[0]).toMatchObject({
      spentCents: 12_000,
      remainingCents: -2000,
      level: 'reached',
    });
  });

  const remove = await renderHook(() => useDeleteTransaction(), { wrapper });

  await act(async () => {
    await remove.result.current?.execute(transactionId);
  });

  await waitFor(() => {
    expect(list.result.current?.data?.[0]?.spentCents).toBe(0);
    expect(list.result.current?.data?.[0]?.level).toBeNull();
  });
});
