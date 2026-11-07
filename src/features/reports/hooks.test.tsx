import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createTransaction } from '@/domain';
import { createTestDeps } from '@/domain/testing/test-deps';
import { useReport } from '@/features/reports/hooks';
import { useCreateTransaction } from '@/features/transactions/hooks';
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

const home = {
  id: 'home',
  name: 'Moradia',
  icon: 'home',
  color: '#7C6AF7',
  type: 'expense' as const,
  isDefault: true,
};

const salary = {
  id: 'salary',
  name: 'Salário',
  icon: 'income',
  color: '#3DDC97',
  type: 'income' as const,
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

test('builds every chart from the existing use cases and refreshes after an expense', async () => {
  await mockHolder.deps?.categories.save(food);
  await mockHolder.deps?.categories.save(home);
  await mockHolder.deps?.categories.save(salary);
  await createTransaction(mockHolder.deps as UseCaseDeps, {
    description: 'Salário',
    amountCents: 20000,
    type: 'income',
    categoryId: 'salary',
    date: '2026-03-01',
    notes: '',
  });
  await createTransaction(mockHolder.deps as UseCaseDeps, {
    description: 'Mercado',
    amountCents: 5000,
    type: 'expense',
    categoryId: 'food',
    date: '2026-03-15',
    notes: '',
  });
  await createTransaction(mockHolder.deps as UseCaseDeps, {
    description: 'Aluguel',
    amountCents: 3000,
    type: 'expense',
    categoryId: 'home',
    date: '2026-04-01',
    notes: '',
  });

  const { wrapper } = renderQuery();
  const report = await renderHook(
    () =>
      useReport({
        from: { year: 2026, month: 3 },
        to: { year: 2026, month: 4 },
      }),
    { wrapper },
  );

  await waitFor(() => {
    expect(report.result.current?.data?.incomeCents).toBe(20000);
  });
  expect(report.result.current?.data?.expenseCents).toBe(8000);
  expect(report.result.current?.data?.balanceCents).toBe(12000);
  expect(report.result.current?.data?.spendingBasisPoints).toBe(4000);
  expect(
    report.result.current?.data?.months.map(month => month.cumulativeCents),
  ).toEqual([15000, 12000]);
  expect(
    report.result.current?.data?.topCategories.map(item => item.categoryName),
  ).toEqual(['Alimentação', 'Moradia']);
  expect(
    report.result.current?.data?.topCategories.some(
      item => item.categoryId === 'salary',
    ),
  ).toBe(false);

  const create = await renderHook(() => useCreateTransaction(), { wrapper });

  await act(async () => {
    await create.result.current?.execute({
      description: 'Feira',
      amountCents: 1000,
      type: 'expense',
      categoryId: 'food',
      date: '2026-03-20',
      notes: '',
    });
  });

  await waitFor(() => {
    expect(report.result.current?.data?.expenseCents).toBe(9000);
  });
  expect(report.result.current?.data?.topCategories[0]).toMatchObject({
    categoryName: 'Alimentação',
    spentCents: 6000,
  });
});
