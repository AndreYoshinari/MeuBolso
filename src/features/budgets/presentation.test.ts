import type { Budget, Category, Transaction } from '@/domain/types';
import {
  budgetCards,
  budgetProgress,
  budgetStatusLabel,
  formatRemaining,
} from '@/features/budgets/presentation';

const food: Category = {
  id: 'food',
  name: 'Alimentação',
  icon: 'cafe',
  color: '#FF6B7A',
  type: 'expense',
  isDefault: true,
};

const budget: Budget = {
  id: 'budget-1',
  categoryId: 'food',
  amountCents: 10_000,
  month: 3,
  year: 2026,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

function expense(
  amountCents: number,
  overrides: Partial<Transaction> = {},
): Transaction {
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
    ...overrides,
  };
}

test('builds the budget card from cents and basis points', () => {
  const [card] = budgetCards(
    [budget],
    [
      expense(8000),
      expense(9000, { id: 'income', type: 'income' }),
      expense(4000, { id: 'april', date: '2026-04-02' }),
    ],
    [food],
  );

  expect(card).toMatchObject({
    categoryName: 'Alimentação',
    limitCents: 10_000,
    spentCents: 8000,
    remainingCents: 2000,
    basisPoints: 8000,
    level: 'warning',
  });
  expect(budgetProgress(card?.basisPoints ?? null)).toBe(0.8);
  expect(budgetStatusLabel('warning', 2000)).toBe('Perto do limite');
  expect(budgetStatusLabel('reached', 0)).toBe('Limite atingido');
  expect(normalize(formatRemaining(2000))).toBe('Restam R$ 20,00');
});

test('shows the exceeded limit without a float remainder', () => {
  const [card] = budgetCards(
    [{ ...budget, amountCents: 3 }],
    [expense(5)],
    [food],
  );

  expect(card).toMatchObject({
    spentCents: 5,
    remainingCents: -2,
    basisPoints: 16667,
    level: 'reached',
  });
  expect(budgetProgress(16667)).toBe(1);
  expect(budgetStatusLabel('reached', -2)).toBe('Limite ultrapassado');
  expect(normalize(formatRemaining(-2))).toBe('Ultrapassou R$ 0,02');
});

function normalize(value: string) {
  return value.replace(/\u00a0/g, ' ');
}
