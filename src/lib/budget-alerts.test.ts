import type { Budget, Category, Transaction } from '@/domain/types';
import { budgetAlerts, budgetLevel } from '@/lib/budget-alerts';

const food: Category = {
  id: 'food',
  name: 'Alimentação',
  icon: 'expense',
  color: '#FF6B7A',
  type: 'expense',
  isDefault: true,
};

function budget(limit: number): Budget {
  return {
    id: 'budget-1',
    categoryId: 'food',
    amountCents: limit,
    month: 3,
    year: 2026,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };
}

function expense(amountCents: number): Transaction {
  return {
    id: 'tx-1',
    description: 'Mercado',
    amountCents,
    type: 'expense',
    categoryId: 'food',
    date: '2026-03-10',
    notes: '',
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
  };
}

test('warns at 80 percent and reports the limit at 100 percent', () => {
  expect(budgetAlerts([budget(10000)], [expense(8000)], [food])).toEqual([
    {
      categoryId: 'food',
      categoryName: 'Alimentação',
      level: 'warning',
      year: 2026,
      month: 3,
    },
  ]);
  expect(
    budgetAlerts([budget(10000)], [expense(10000)], [food])[0]?.level,
  ).toBe('reached');
  expect(budgetAlerts([budget(10000)], [expense(1000)], [food])).toEqual([]);
  expect(
    budgetAlerts(
      [budget(10000)],
      [{ ...expense(10000), id: 'income', type: 'income' }],
      [food],
    ),
  ).toEqual([]);
});

test('marks the limit as near from 80 percent and passed from 100 percent', () => {
  expect(budgetLevel(null)).toBeNull();
  expect(budgetLevel(7999)).toBeNull();
  expect(budgetLevel(8000)).toBe('warning');
  expect(budgetLevel(9999)).toBe('warning');
  expect(budgetLevel(10000)).toBe('reached');
  expect(budgetLevel(15000)).toBe('reached');
});
