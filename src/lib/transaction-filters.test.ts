import type { Transaction } from '@/domain/types';
import {
  filtersForMonth,
  parseTransactionSearchParams,
  periodLabelForFilters,
  selectTransactions,
} from '@/lib/transaction-filters';

const now = new Date(2026, 2, 15);

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Mercado',
    amountCents: 1000,
    type: 'expense',
    categoryId: 'food',
    date: '2026-03-15',
    notes: '',
    createdAt: '2026-03-15T12:00:00.000Z',
    updatedAt: '2026-03-15T12:00:00.000Z',
    ...overrides,
  };
}

test('uses the current civil month when the route has no filters', () => {
  expect(parseTransactionSearchParams({}, now)).toEqual({
    type: undefined,
    categoryId: undefined,
    query: undefined,
    from: '2026-03-01',
    to: '2026-03-31',
  });
});

test('reads filters from search params', () => {
  expect(
    parseTransactionSearchParams(
      {
        type: 'income',
        categoryId: 'salary',
        q: 'salário',
        from: '2026-04-01',
        to: '2026-04-10',
      },
      now,
    ),
  ).toEqual({
    type: 'income',
    categoryId: 'salary',
    query: 'salário',
    from: '2026-04-01',
    to: '2026-04-10',
  });
});

test('selects transactions by type, category and civil period', () => {
  const transactions = [
    transaction(),
    transaction({
      id: 'income',
      type: 'income',
      categoryId: 'salary',
      date: '2026-03-02',
    }),
    transaction({ id: 'april', date: '2026-04-01' }),
  ];

  expect(
    selectTransactions(transactions, {
      type: 'expense',
      categoryId: 'food',
      from: '2026-03-01',
      to: '2026-03-31',
    }).map(item => item.id),
  ).toEqual(['tx-1']);
});

test('searches the description without matching the letter case', () => {
  const transactions = [
    transaction(),
    transaction({ id: 'fair', description: 'Feira' }),
  ];

  expect(
    selectTransactions(transactions, {
      query: '  FEIRA ',
      from: '2026-03-01',
      to: '2026-03-31',
    }).map(item => item.id),
  ).toEqual(['fair']);
});

test('moves the period by a civil month and keeps the other filters', () => {
  const next = filtersForMonth(
    {
      type: 'expense',
      categoryId: 'food',
      query: 'mercado',
      from: '2026-03-01',
      to: '2026-03-31',
    },
    { year: 2026, month: 4 },
  );

  expect(next).toEqual({
    type: 'expense',
    categoryId: 'food',
    query: 'mercado',
    from: '2026-04-01',
    to: '2026-04-30',
  });
  expect(periodLabelForFilters(next)).toBe('abril de 2026');
  expect(periodLabelForFilters({ from: '2026-04-02', to: '2026-04-10' })).toBe(
    '02/04/2026 a 10/04/2026',
  );
});
