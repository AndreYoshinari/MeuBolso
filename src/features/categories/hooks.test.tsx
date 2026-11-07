import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createTestDeps } from '@/domain/testing/test-deps';
import {
  useCategories,
  useCategoryTransactionCounts,
  useCreateCategory,
  useDeleteCategory,
} from '@/features/categories/hooks';
import { ValidationError } from '@/lib/errors';
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

const input = {
  name: 'Presentes',
  icon: 'gift',
  color: '#FF6B7A',
  type: 'expense' as const,
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

test('reloads categories after create and delete', async () => {
  const { wrapper } = renderQuery();
  const list = await renderHook(() => useCategories(), { wrapper });
  const create = await renderHook(() => useCreateCategory(), { wrapper });

  let createdId = '';

  await act(async () => {
    const created = await create.result.current?.execute(input);
    createdId = created?.id ?? '';
  });

  await waitFor(() => {
    expect(list.result.current?.data?.map(category => category.name)).toEqual([
      'Presentes',
    ]);
  });

  const remove = await renderHook(() => useDeleteCategory(), { wrapper });

  await act(async () => {
    await remove.result.current?.execute(createdId);
  });

  await waitFor(() => {
    expect(list.result.current?.data).toEqual([]);
  });
});

test('keeps the duplicate and default-category errors', async () => {
  const { wrapper } = renderQuery();
  const create = await renderHook(() => useCreateCategory(), { wrapper });

  await act(async () => {
    await create.result.current?.execute(input);
    await expect(
      create.result.current?.execute({ ...input, name: 'presentes' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  await waitFor(() => {
    expect(create.result.current?.errorMessage).toBe(
      'Já existe uma categoria com este nome e tipo.',
    );
  });

  const created = (await mockHolder.deps?.categories.list())?.[0];

  if (!created) {
    throw new Error('Categoria ausente.');
  }

  await mockHolder.deps?.categories.save({ ...created, isDefault: true });
  const remove = await renderHook(() => useDeleteCategory(), { wrapper });

  await act(async () => {
    await expect(remove.result.current?.execute(created.id)).rejects.toThrow(
      'Categoria padrão não pode ser excluída.',
    );
  });

  expect(await mockHolder.deps?.categories.findById(created.id)).not.toBeNull();
});

test('counts transactions for each category', async () => {
  await mockHolder.deps?.categories.save({
    id: 'food',
    name: 'Alimentação',
    icon: 'cafe',
    color: '#FF6B7A',
    type: 'expense',
    isDefault: true,
  });
  await mockHolder.deps?.transactions.save({
    id: 'tx-1',
    description: 'Mercado',
    amountCents: 1000,
    type: 'expense',
    categoryId: 'food',
    date: '2026-03-01',
    notes: '',
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  });
  const { wrapper } = renderQuery();
  const counts = await renderHook(() => useCategoryTransactionCounts(), {
    wrapper,
  });

  await waitFor(() => {
    expect(counts.result.current?.data).toEqual({ food: 1 });
  });
});
