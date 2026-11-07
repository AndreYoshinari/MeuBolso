import {
  barChartMax,
  categorySlices,
  formatShare,
  greetingForHour,
  incomeExpenseBars,
  isEmptyPeriod,
} from '@/features/dashboard/presentation';

test('greets by the hour and builds chart series from the summary', () => {
  expect(greetingForHour(9)).toBe('Bom dia');
  expect(greetingForHour(9, ' Ana ')).toBe('Bom dia, Ana');
  expect(greetingForHour(15)).toBe('Boa tarde');
  expect(greetingForHour(20)).toBe('Boa noite');

  const summary = { incomeCents: 20000, expenseCents: 5000 };

  expect(isEmptyPeriod({ incomeCents: 0, expenseCents: 0 })).toBe(true);
  expect(incomeExpenseBars(summary)).toEqual([
    { label: 'Receitas', value: 20000, tone: 'income' },
    { label: 'Despesas', value: 5000, tone: 'expense' },
  ]);
  expect(barChartMax(incomeExpenseBars(summary))).toBe(20000);
  expect(formatShare(6250)).toBe('62,50%');
  expect(formatShare(2500)).toBe('25%');
});

test('keeps category shares in the same order as the expenses', () => {
  const slices = categorySlices(
    [
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
    ],
    ['#111111', '#222222'],
  );

  expect(slices).toEqual([
    {
      id: 'food',
      name: 'Alimentação',
      value: 5000,
      color: '#111111',
      basisPoints: 6250,
    },
    {
      id: 'home',
      name: 'Moradia',
      value: 3000,
      color: '#222222',
      basisPoints: 3750,
    },
  ]);
});
