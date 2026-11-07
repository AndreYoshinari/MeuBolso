import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createTestDeps } from '@/domain/testing/test-deps';
import { useCategories } from '@/features/categories/hooks';
import { useRateQuote } from '@/features/rates/hooks';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactionFilters,
  useTransactions,
  useUpdateTransaction,
} from '@/features/transactions/hooks';
import { ValidationError } from '@/lib/errors';
import { createAppQueryClient } from '@/providers/query-client';
import { loadRateQuote } from '@/services/rates';
import type { UseCaseDeps } from '@/services/database';
import { initialSessionData, useSessionStore } from '@/stores/session';

const mockHolder: { deps: UseCaseDeps | null } = { deps: null };
const mockSetParams = jest.fn();
let mockParams: Record<string, string> = {};

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

jest.mock('@/services/rates', () => ({
  loadRateQuote: jest.fn(),
  loadCurrencies: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ setParams: mockSetParams }),
}));

const mockedRates = jest.mocked(loadRateQuote);

const food = {
  id: 'food',
  name: 'Alimentação',
  icon: 'expense',
  color: '#FF6B7A',
  type: 'expense' as const,
  isDefault: true,
};

const filters = { from: '2026-03-01', to: '2026-03-31' };

function renderQuery() {
  const client = createAppQueryClient();
  client.setDefaultOptions({
    queries: { retry: false, networkMode: 'always', gcTime: 0 },
    mutations: { retry: false, networkMode: 'always', gcTime: 0 },
  });

  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  mockHolder.deps = createTestDeps();
  mockParams = {};
  mockSetParams.mockReset();
  mockedRates.mockReset();
  useSessionStore.setState(initialSessionData);
});

test('reloads transactions after a successful create', async () => {
  await mockHolder.deps?.categories.save(food);
  const { wrapper } = renderQuery();
  const list = await renderHook(() => useTransactions(filters), { wrapper });

  await waitFor(() => {
    expect(list.result.current?.data).toEqual([]);
  });

  const create = await renderHook(() => useCreateTransaction(), { wrapper });

  await act(async () => {
    await create.result.current?.execute({
      description: 'Mercado',
      amountCents: 18690,
      type: 'expense',
      categoryId: 'food',
      date: '2026-03-15',
      notes: '',
    });
  });

  await waitFor(() => {
    expect(list.result.current?.data).toHaveLength(1);
  });
  expect(list.result.current?.errorMessage).toBeNull();
});

test('reloads the list after edit and delete', async () => {
  await mockHolder.deps?.categories.save(food);
  const { wrapper } = renderQuery();
  const list = await renderHook(() => useTransactions(filters), { wrapper });
  const create = await renderHook(() => useCreateTransaction(), { wrapper });

  let createdId = '';

  await act(async () => {
    const created = await create.result.current?.execute({
      description: 'Mercado',
      amountCents: 18690,
      type: 'expense',
      categoryId: 'food',
      date: '2026-03-15',
      notes: '',
    });
    createdId = created?.id ?? '';
  });

  const update = await renderHook(() => useUpdateTransaction(), { wrapper });

  await act(async () => {
    await update.result.current?.execute({
      id: createdId,
      input: {
        description: 'Feira',
        amountCents: 2000,
        type: 'expense',
        categoryId: 'food',
        date: '2026-03-15',
        notes: '',
      },
    });
  });

  await waitFor(() => {
    expect(list.result.current?.data?.[0]?.description).toBe('Feira');
    expect(list.result.current?.data?.[0]?.amountCents).toBe(2000);
  });

  const remove = await renderHook(() => useDeleteTransaction(), { wrapper });

  await act(async () => {
    await remove.result.current?.execute(createdId);
  });

  await waitFor(() => {
    expect(list.result.current?.data).toEqual([]);
  });
});

test('keeps the form error when the transaction is invalid', async () => {
  await mockHolder.deps?.categories.save(food);
  const { wrapper } = renderQuery();
  const create = await renderHook(() => useCreateTransaction(), { wrapper });

  await act(async () => {
    await expect(
      create.result.current?.execute({
        description: 'Mercado',
        amountCents: 0,
        type: 'expense',
        categoryId: 'food',
        date: '2026-03-15',
        notes: '',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  await waitFor(() => {
    expect(create.result.current?.errorMessage).toBe(
      'Informe um valor inteiro maior que zero, em centavos.',
    );
  });
  expect(await mockHolder.deps?.transactions.list()).toEqual([]);
});

test('loads categories from the repository', async () => {
  await mockHolder.deps?.categories.save(food);
  const { wrapper } = renderQuery();
  const view = await renderHook(() => useCategories(), { wrapper });

  await waitFor(() => {
    expect(view.result.current?.data?.map(category => category.name)).toEqual([
      'Alimentação',
    ]);
  });
});

test('exposes a stored quote', async () => {
  const { wrapper } = renderQuery();
  mockedRates.mockResolvedValue({
    origin: 'network',
    quote: {
      base: 'USD',
      quote: 'BRL',
      rate: '5.10',
      quotedOn: '2026-11-06',
      fetchedAt: '2026-11-06T12:00:00.000Z',
    },
  });
  const view = await renderHook(
    () => useRateQuote({ base: 'USD', quote: 'BRL', date: null }),
    { wrapper },
  );

  await waitFor(() => {
    expect(view.result.current?.data?.quote.rate).toBe('5.10');
  });
});

test('hides the raw failure of a quote request', async () => {
  const { wrapper } = renderQuery();
  mockedRates.mockRejectedValue(new Error('HTTP 500 body'));
  const view = await renderHook(
    () => useRateQuote({ base: 'USD', quote: 'BRL', date: null }),
    { wrapper },
  );

  await waitFor(() => {
    expect(view.result.current?.errorMessage).toBe(
      'Não foi possível concluir a operação.',
    );
  });
});

test('prefers route filters and stores the next selection', async () => {
  mockParams = { from: '2026-04-01', to: '2026-04-30', type: 'expense' };
  const view = await renderHook(() => useTransactionFilters());

  expect(view.result.current?.filters).toMatchObject({
    from: '2026-04-01',
    to: '2026-04-30',
    type: 'expense',
  });

  mockParams = {};
  const stored = await renderHook(() => useTransactionFilters());

  await act(async () => {
    stored.result.current?.setFilters({
      from: '2026-05-01',
      to: '2026-05-31',
      type: 'income',
    });
  });

  expect(useSessionStore.getState().filters).toMatchObject({
    from: '2026-05-01',
    type: 'income',
  });
  expect(mockSetParams).toHaveBeenCalledWith({
    type: 'income',
    categoryId: '',
    q: '',
    from: '2026-05-01',
    to: '2026-05-31',
  });
});
