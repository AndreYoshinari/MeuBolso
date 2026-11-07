import { ValidationError } from '@/lib/errors';

import {
  createTransaction,
  getExpensesByCategory,
  getFinancialSummary,
  getMonthlyFinancialHistory,
  getRecentTransactions,
  getTotalBalance,
} from '@/domain';
import { createTestDeps } from '@/domain/testing/test-deps';
import type { Category } from '@/domain/types';

const food: Category = {
  id: 'food',
  name: 'Alimentação',
  icon: 'expense',
  color: '#FF6B7A',
  type: 'expense',
  isDefault: true,
};

const home: Category = {
  id: 'home',
  name: 'Moradia',
  icon: 'expense',
  color: '#7C6AF7',
  type: 'expense',
  isDefault: true,
};

const salary: Category = {
  id: 'salary',
  name: 'Salário',
  icon: 'income',
  color: '#3DDC97',
  type: 'income',
  isDefault: true,
};

async function seed() {
  const deps = createTestDeps();
  await deps.categories.save(food);
  await deps.categories.save(home);
  await deps.categories.save(salary);
  await createTransaction(deps, {
    description: 'Salário',
    amountCents: 20000,
    type: 'income',
    categoryId: 'salary',
    date: '2026-03-01',
    notes: '',
  });
  await createTransaction(deps, {
    description: 'Mercado',
    amountCents: 5000,
    type: 'expense',
    categoryId: 'food',
    date: '2026-03-15',
    notes: '',
  });
  await createTransaction(deps, {
    description: 'Aluguel',
    amountCents: 3000,
    type: 'expense',
    categoryId: 'home',
    date: '2026-04-01',
    notes: '',
  });

  return deps;
}

test('summarizes a month from persisted transactions', async () => {
  const deps = await seed();
  const summary = await getFinancialSummary(deps, { year: 2026, month: 3 });

  expect(summary).toEqual({
    period: { year: 2026, month: 3 },
    incomeCents: 20000,
    expenseCents: 5000,
    balanceCents: 15000,
    spendingBasisPoints: 2500,
  });
});

test('lists expense categories with their share of the period', async () => {
  const deps = await seed();
  await createTransaction(deps, {
    description: 'Aluguel de março',
    amountCents: 3000,
    type: 'expense',
    categoryId: 'home',
    date: '2026-03-20',
    notes: '',
  });

  const expenses = await getExpensesByCategory(deps, { year: 2026, month: 3 });

  expect(expenses).toEqual([
    {
      categoryId: 'food',
      categoryName: 'Alimentação',
      spentCents: 5000,
      basisPoints: 6250,
    },
    {
      categoryId: 'home',
      categoryName: 'Moradia',
      spentCents: 3000,
      basisPoints: 3750,
    },
  ]);
});

test('builds twelve monthly snapshots for the year', async () => {
  const deps = await seed();
  const history = await getMonthlyFinancialHistory(deps, 2026);

  expect(history).toHaveLength(12);
  expect(history[2]).toEqual({
    year: 2026,
    month: 3,
    incomeCents: 20000,
    expenseCents: 5000,
    balanceCents: 15000,
  });
  expect(history[3]).toMatchObject({
    month: 4,
    incomeCents: 0,
    expenseCents: 3000,
    balanceCents: -3000,
  });
  expect(history[0]).toMatchObject({
    month: 1,
    incomeCents: 0,
    expenseCents: 0,
  });
  await expect(getMonthlyFinancialHistory(deps, 0)).rejects.toThrow(
    ValidationError,
  );
});

test('totals every persisted transaction and lists the latest of the month', async () => {
  const deps = await seed();

  await expect(getTotalBalance(deps)).resolves.toBe(12000);

  const recent = await getRecentTransactions(deps, { year: 2026, month: 3 });

  expect(recent.map(item => item.description)).toEqual(['Mercado', 'Salário']);
  expect(recent[0]).toMatchObject({
    categoryName: 'Alimentação',
    amountCents: 5000,
    type: 'expense',
    date: '2026-03-15',
  });
  await expect(
    getRecentTransactions(deps, { year: 2026, month: 1 }),
  ).resolves.toEqual([]);
});
