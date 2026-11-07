import { NotFoundError, ValidationError } from '@/lib/errors';

import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  getTransactions,
  getTransactionsByPeriod,
  updateTransaction,
  type Category,
} from '@/domain';
import { createTestDeps } from '@/domain/testing/test-deps';

const food: Category = {
  id: 'food',
  name: 'Alimentação',
  icon: 'expense',
  color: '#FF6B7A',
  type: 'expense',
  isDefault: true,
};

const expense = {
  description: 'Mercado',
  amountCents: 18690,
  type: 'expense' as const,
  categoryId: 'food',
  date: '2026-03-15',
  notes: '',
};

async function seed() {
  const deps = createTestDeps();
  await deps.categories.save(food);
  return deps;
}

test('creates a transaction only after validation', async () => {
  const deps = await seed();
  const created = await createTransaction(deps, expense);

  expect(created.id).toBe('id-1');
  expect(created.amountCents).toBe(18690);
  expect(await getTransactions(deps)).toEqual([created]);

  await expect(
    createTransaction(deps, { ...expense, amountCents: 0 }),
  ).rejects.toThrow(ValidationError);
  expect(await getTransactions(deps)).toHaveLength(1);
});

test('updates, finds and deletes a transaction', async () => {
  const deps = await seed();
  const created = await createTransaction(deps, expense);
  const updated = await updateTransaction(deps, created.id, {
    ...expense,
    description: 'Feira',
    date: '2026-03-20',
  });

  expect(updated.description).toBe('Feira');
  expect(updated.createdAt).toBe(created.createdAt);
  expect(await getTransactionById(deps, created.id)).toMatchObject({
    description: 'Feira',
  });

  await deleteTransaction(deps, created.id);

  await expect(getTransactionById(deps, created.id)).rejects.toThrow(
    NotFoundError,
  );
  await expect(deleteTransaction(deps, created.id)).rejects.toThrow(
    NotFoundError,
  );
});

test('lists the newest transaction first and refuses to update a missing one', async () => {
  const deps = await seed();
  await createTransaction(deps, { ...expense, date: '2026-03-01' });
  await createTransaction(deps, {
    ...expense,
    date: '2026-03-20',
    description: 'Feira',
  });

  expect((await getTransactions(deps)).map(item => item.description)).toEqual([
    'Feira',
    'Mercado',
  ]);

  await expect(
    updateTransaction(deps, 'ausente', { ...expense, description: 'Nada' }),
  ).rejects.toThrow(NotFoundError);
  expect(await getTransactions(deps)).toHaveLength(2);
});

test('filters transactions by civil period', async () => {
  const deps = await seed();
  await createTransaction(deps, expense);
  await createTransaction(deps, {
    ...expense,
    date: '2026-04-01',
    description: 'Abril',
  });

  const march = await getTransactionsByPeriod(deps, { year: 2026, month: 3 });

  expect(march.map(item => item.description)).toEqual(['Mercado']);
  await expect(
    getTransactionsByPeriod(deps, { year: 2026, month: 13 }),
  ).rejects.toThrow(ValidationError);
});
