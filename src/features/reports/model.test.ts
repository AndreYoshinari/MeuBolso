import type { CategoryExpense, MonthlySnapshot } from '@/domain';

import {
  buildReport,
  formatReportLabel,
  monthsInRange,
  rangeForPreset,
} from '@/features/reports/model';

const november = new Date(2026, 10, 6);
const january = new Date(2026, 0, 15);

test('builds each report filter from the civil month', () => {
  expect(rangeForPreset('current', november)).toEqual({
    from: { year: 2026, month: 11 },
    to: { year: 2026, month: 11 },
  });
  expect(rangeForPreset('previous', november)).toEqual({
    from: { year: 2026, month: 10 },
    to: { year: 2026, month: 10 },
  });
  expect(rangeForPreset('previous', january)).toEqual({
    from: { year: 2025, month: 12 },
    to: { year: 2025, month: 12 },
  });
  expect(
    monthsInRange(rangeForPreset('last3', november)).map(month => month.month),
  ).toEqual([9, 10, 11]);
  expect(
    monthsInRange(rangeForPreset('last6', november)).map(month => month.month),
  ).toEqual([6, 7, 8, 9, 10, 11]);
  expect(rangeForPreset('year', november)).toEqual({
    from: { year: 2026, month: 1 },
    to: { year: 2026, month: 12 },
  });
  expect(formatReportLabel(rangeForPreset('year', november))).toBe('2026');
  expect(formatReportLabel(rangeForPreset('last3', november))).toBe(
    'setembro a novembro de 2026',
  );
  expect(formatReportLabel(rangeForPreset('last3', january))).toBe(
    'novembro de 2025 a janeiro de 2026',
  );
});

test('keeps a custom range in order and within two years', () => {
  const inverted = rangeForPreset('custom', november, {
    from: { year: 2026, month: 12 },
    to: { year: 2026, month: 3 },
  });

  expect(monthsInRange(inverted).map(month => month.month)).toEqual([
    3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);

  const capped = monthsInRange({
    from: { year: 2024, month: 1 },
    to: { year: 2026, month: 6 },
  });

  expect(capped).toHaveLength(24);
  expect(capped[0]).toEqual({ year: 2024, month: 1 });
  expect(capped[23]).toEqual({ year: 2025, month: 12 });
});

test('merges category expenses and accumulates the signed balance', () => {
  const snapshots: MonthlySnapshot[] = [
    {
      year: 2026,
      month: 3,
      incomeCents: 200,
      expenseCents: 100,
      balanceCents: 100,
    },
    {
      year: 2026,
      month: 4,
      incomeCents: 0,
      expenseCents: 40,
      balanceCents: -40,
    },
    {
      year: 2026,
      month: 5,
      incomeCents: 20,
      expenseCents: 10,
      balanceCents: 10,
    },
    {
      year: 2026,
      month: 6,
      incomeCents: 999,
      expenseCents: 999,
      balanceCents: 0,
    },
  ];
  const food = expense('food', 'Alimentação', 1);
  const home = expense('home', 'Moradia', 2);
  const report = buildReport(
    { from: { year: 2026, month: 3 }, to: { year: 2026, month: 5 } },
    snapshots,
    [[food], [home], []],
  );

  expect(report.months.map(month => month.month)).toEqual([3, 4, 5]);
  expect(report.months.map(month => month.tick)).toEqual(['mar', 'abr', 'mai']);
  expect(report.months.map(month => month.cumulativeCents)).toEqual([
    100, 60, 70,
  ]);
  expect(report.incomeCents).toBe(220);
  expect(report.expenseCents).toBe(150);
  expect(report.balanceCents).toBe(70);
  expect(report.spendingBasisPoints).toBe(6818);
  expect(report.chartCategories).toEqual([
    { ...home, basisPoints: 6667 },
    { ...food, basisPoints: 3333 },
  ]);
  expect(report.comparison.map(month => month.balanceDeltaCents)).toEqual([
    null,
    -140,
    50,
  ]);
  expect(report.empty).toBe(false);
});

test('compares a single month with the previous one and ignores income as spending', () => {
  const report = buildReport(
    { from: { year: 2026, month: 11 }, to: { year: 2026, month: 11 } },
    [
      {
        year: 2026,
        month: 10,
        incomeCents: 100,
        expenseCents: 0,
        balanceCents: 100,
      },
      {
        year: 2026,
        month: 11,
        incomeCents: 40,
        expenseCents: 0,
        balanceCents: 40,
      },
    ],
    [[]],
  );

  expect(report.comparison.map(month => month.month)).toEqual([10, 11]);
  expect(report.comparison.map(month => month.balanceDeltaCents)).toEqual([
    null,
    -60,
  ]);
  expect(report.expenseCents).toBe(0);
  expect(report.topCategories).toEqual([]);
  expect(report.spendingBasisPoints).toBe(0);
  expect(report.empty).toBe(false);
});

test('folds the tail of the ranking into the remaining slice', () => {
  const categories = ['a', 'b', 'c', 'd', 'e', 'f'].map(id =>
    expense(id, id.toUpperCase(), 100),
  );
  const report = buildReport(
    { from: { year: 2026, month: 1 }, to: { year: 2026, month: 1 } },
    [
      {
        year: 2026,
        month: 1,
        incomeCents: 600,
        expenseCents: 600,
        balanceCents: 0,
      },
    ],
    [categories],
  );

  expect(report.topCategories).toHaveLength(5);
  expect(report.chartCategories[5]).toEqual({
    categoryId: 'other-expenses',
    categoryName: 'Outras',
    spentCents: 100,
    basisPoints: 1667,
  });
});

test('treats a period without movement as empty', () => {
  const report = buildReport(
    { from: { year: 2026, month: 8 }, to: { year: 2026, month: 8 } },
    [],
    [[]],
  );

  expect(report.empty).toBe(true);
  expect(report.balanceCents).toBe(0);
});

function expense(
  categoryId: string,
  categoryName: string,
  spentCents: number,
): CategoryExpense {
  return {
    categoryId,
    categoryName,
    spentCents,
    basisPoints: null,
  };
}
