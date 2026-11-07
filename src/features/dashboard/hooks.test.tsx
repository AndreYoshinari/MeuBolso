import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createTransaction } from '@/domain';
import { createTestDeps } from '@/domain/testing/test-deps';
import { useDashboard } from '@/features/dashboard/hooks';
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

beforeEach(() => {
  mockHolder.deps = createTestDeps();
});

function renderQuery() {
  const client = createAppQueryClient();
  client.setDefaultOptions({
    queries: { retry: false, networkMode: 'always', gcTime: 0 },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

test('loads the month from the local ledger and rejects a bad period', async () => {
  await mockHolder.deps?.categories.save({
    id: 'food',
    name: 'Alimentação',
    icon: 'cafe',
    color: '#FF6B7A',
    type: 'expense',
    isDefault: true,
  });
  await createTransaction(mockHolder.deps as UseCaseDeps, {
    description: 'Mercado',
    amountCents: 5000,
    type: 'expense',
    categoryId: 'food',
    date: '2026-03-10',
    notes: '',
  });

  const { wrapper } = renderQuery();
  const dashboard = await renderHook(() => useDashboard('2026-03'), {
    wrapper,
  });

  await waitFor(() => {
    expect(dashboard.result.current?.data?.summary.expenseCents).toBe(5000);
  });
  expect(dashboard.result.current?.data?.totalBalanceCents).toBe(-5000);
  expect(dashboard.result.current?.data?.expenses[0]).toMatchObject({
    categoryName: 'Alimentação',
    spentCents: 5000,
    basisPoints: 10000,
  });
  expect(dashboard.result.current?.data?.recent[0]?.description).toBe(
    'Mercado',
  );

  const invalid = await renderHook(() => useDashboard('2026-13'), { wrapper });

  await waitFor(() => {
    expect(invalid.result.current?.errorMessage).toBe(
      'Informe um mês e um ano válidos.',
    );
  });
  expect(invalid.result.current?.data).toBeUndefined();
});
