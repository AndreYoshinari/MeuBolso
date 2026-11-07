import { ValidationError } from '@/lib/errors';

import {
  calculateBalance,
  calculateBudgetUtilization,
  calculateSpendingBasisPoints,
  countTransactionsByCategory,
  groupTransactionsByCategory,
  groupTransactionsByPeriod,
  sumExpenses,
  sumIncome,
  type Budget,
  type Transaction,
} from '@/domain';

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Mercado',
    amountCents: 10000,
    type: 'expense',
    categoryId: 'food',
    date: '2026-03-01',
    notes: '',
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
    ...overrides,
  };
}

const transactions = [
  transaction({
    id: 'income',
    description: 'Salário',
    amountCents: 20000,
    type: 'income',
    categoryId: 'salary',
    date: '2026-03-01',
  }),
  transaction({
    id: 'food',
    amountCents: 5000,
    categoryId: 'food',
    date: '2026-03-15',
  }),
  transaction({
    id: 'rent',
    description: 'Aluguel',
    amountCents: 3000,
    categoryId: 'home',
    date: '2026-04-01',
  }),
];

const budget: Budget = {
  id: 'budget-1',
  categoryId: 'food',
  amountCents: 10000,
  month: 3,
  year: 2026,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

test('sums income, expenses and balance in cents', () => {
  expect(sumIncome(transactions)).toBe(20000);
  expect(sumExpenses(transactions)).toBe(8000);
  expect(calculateBalance(transactions)).toBe(12000);
  expect(calculateBalance([])).toBe(0);
});

test('returns a negative balance when expenses exceed income', () => {
  expect(
    calculateBalance([transaction({ amountCents: 4000, type: 'expense' })]),
  ).toBe(-4000);
});

test('calculates spending as basis points of income', () => {
  expect(calculateSpendingBasisPoints(transactions)).toBe(4000);
  expect(
    calculateSpendingBasisPoints([
      transaction({ amountCents: 1000, type: 'expense' }),
    ]),
  ).toBeNull();
});

test('calculates budget utilization for the category and month', () => {
  expect(calculateBudgetUtilization(budget, transactions)).toEqual({
    spentCents: 5000,
    limitCents: 10000,
    basisPoints: 5000,
  });

  const overBudget = calculateBudgetUtilization(
    { ...budget, amountCents: 2000 },
    transactions,
  );

  expect(overBudget.spentCents).toBe(5000);
  expect(overBudget.basisPoints).toBe(25000);
});

test('counts only expenses of the same category and civil month', () => {
  const utilization = calculateBudgetUtilization(budget, [
    transaction({
      id: 'income-food',
      type: 'income',
      categoryId: 'food',
      amountCents: 9000,
      date: '2026-03-02',
    }),
    transaction({
      id: 'april-food',
      categoryId: 'food',
      amountCents: 4000,
      date: '2026-04-02',
    }),
    transaction({
      id: 'other',
      categoryId: 'home',
      amountCents: 7000,
      date: '2026-03-02',
    }),
    transaction({
      id: 'cent',
      categoryId: 'food',
      amountCents: 1,
      date: '2026-03-20',
    }),
  ]);

  expect(utilization.spentCents).toBe(1);
  expect(utilization.basisPoints).toBe(1);

  expect(
    calculateBudgetUtilization({ ...budget, amountCents: 3 }, [
      transaction({
        id: 'cent',
        categoryId: 'food',
        amountCents: 1,
        date: '2026-03-20',
      }),
    ]).basisPoints,
  ).toBe(3333);
});

test('counts transactions by category', () => {
  expect(countTransactionsByCategory(transactions)).toEqual({
    salary: 1,
    food: 1,
    home: 1,
  });
});

test('groups transactions by category and by civil period', () => {
  const byCategory = groupTransactionsByCategory(transactions);

  expect(byCategory.map(group => group.key)).toEqual([
    'food',
    'home',
    'salary',
  ]);
  expect(byCategory.find(group => group.key === 'food')).toMatchObject({
    incomeCents: 0,
    expenseCents: 5000,
  });

  const byPeriod = groupTransactionsByPeriod(transactions);

  expect(byPeriod.map(group => group.key)).toEqual([
    { year: 2026, month: 3 },
    { year: 2026, month: 4 },
  ]);
  expect(byPeriod[0]?.transactions.map(item => item.id)).toEqual([
    'income',
    'food',
  ]);
});

test('keeps 1 March in March when grouping by period', () => {
  const groups = groupTransactionsByPeriod([
    transaction({ date: '2026-03-01' }),
  ]);

  expect(groups[0]?.key).toEqual({ year: 2026, month: 3 });
});

test('rejects a transaction whose date is not a civil day', () => {
  expect(() =>
    groupTransactionsByPeriod([transaction({ date: '2026-02-31' })]),
  ).toThrow(ValidationError);
});

test('rejects a non-integer amount during calculation', () => {
  expect(() => sumExpenses([transaction({ amountCents: 10.5 })])).toThrow(
    ValidationError,
  );
});
