import type { CategoryExpense, MonthlySnapshot } from '@/domain';
import { addCents, addSignedCents, toBasisPoints } from '@/lib/money';
import {
  formatPeriodLabel,
  formatYearMonth,
  shiftYearMonth,
  type YearMonth,
} from '@/lib/period';

const maxMonths = 24;
const topLimit = 5;

const ticks = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

export type ReportPreset =
  'current' | 'previous' | 'last3' | 'last6' | 'year' | 'custom';

export type ReportRange = {
  from: YearMonth;
  to: YearMonth;
};

export type ReportMonth = {
  year: number;
  month: number;
  label: string;
  tick: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  cumulativeCents: number;
  spendingBasisPoints: number | null;
};

export type ComparisonMonth = {
  year: number;
  month: number;
  label: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  balanceDeltaCents: number | null;
};

export type FinancialReport = {
  from: YearMonth;
  to: YearMonth;
  label: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  spendingBasisPoints: number | null;
  months: ReportMonth[];
  comparison: ComparisonMonth[];
  chartCategories: CategoryExpense[];
  topCategories: CategoryExpense[];
  empty: boolean;
};

export function rangeForPreset(
  preset: ReportPreset,
  today: Date,
  custom?: ReportRange,
): ReportRange {
  const current = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  };
  const month = { from: current, to: current };

  switch (preset) {
    case 'previous': {
      const previous = shiftYearMonth(current, -1);
      return { from: previous, to: previous };
    }
    case 'last3':
      return { from: shiftYearMonth(current, -2), to: current };
    case 'last6':
      return { from: shiftYearMonth(current, -5), to: current };
    case 'year':
      return {
        from: { year: current.year, month: 1 },
        to: { year: current.year, month: 12 },
      };
    case 'custom':
      return clampReportRange(custom ?? month);
    case 'current':
      return month;
  }
}

export function clampReportRange(range: ReportRange): ReportRange {
  const ordered = orderedRange(range);
  const maxTo = shiftYearMonth(ordered.from, maxMonths - 1);

  if (monthIndex(ordered.to) > monthIndex(maxTo)) {
    return { from: ordered.from, to: maxTo };
  }

  return ordered;
}

export function monthsInRange(range: ReportRange): YearMonth[] {
  const ordered = clampReportRange(range);
  const months: YearMonth[] = [];
  let cursor = ordered.from;

  for (let guard = 0; guard < maxMonths; guard += 1) {
    months.push(cursor);

    if (monthIndex(cursor) >= monthIndex(ordered.to)) {
      return months;
    }

    const next = shiftYearMonth(cursor, 1);

    if (monthIndex(next) === monthIndex(cursor)) {
      return months;
    }

    cursor = next;
  }

  return months;
}

export function formatReportLabel(range: ReportRange): string {
  const months = monthsInRange(range);
  const from = months[0] ?? range.from;
  const to = months[months.length - 1] ?? from;

  if (from.year === to.year && from.month === to.month) {
    return formatPeriodLabel(from);
  }

  if (from.year === to.year && from.month === 1 && to.month === 12) {
    return String(from.year);
  }

  if (from.year === to.year) {
    return `${monthWord(from)} a ${monthWord(to)} de ${from.year}`;
  }

  return `${formatPeriodLabel(from)} a ${formatPeriodLabel(to)}`;
}

export function buildReport(
  range: ReportRange,
  snapshots: readonly MonthlySnapshot[],
  expensesByMonth: readonly (readonly CategoryExpense[])[],
): FinancialReport {
  const months = monthsInRange(range);
  const from = months[0] ?? range.from;
  const to = months[months.length - 1] ?? from;
  const spanYears = from.year !== to.year;
  const byPeriod = new Map(
    snapshots.map(snapshot => [
      formatYearMonth(snapshot.year, snapshot.month),
      snapshot,
    ]),
  );
  let cumulativeCents = 0;
  const reportMonths = months.map(period => {
    const snapshot = byPeriod.get(formatYearMonth(period.year, period.month));
    const incomeCents = snapshot?.incomeCents ?? 0;
    const expenseCents = snapshot?.expenseCents ?? 0;
    const balanceCents = snapshot?.balanceCents ?? 0;
    cumulativeCents = addSignedCents(cumulativeCents, balanceCents);

    return {
      year: period.year,
      month: period.month,
      label: formatPeriodLabel(period),
      tick: monthTick(period, spanYears),
      incomeCents,
      expenseCents,
      balanceCents,
      cumulativeCents,
      spendingBasisPoints: toBasisPoints(expenseCents, incomeCents),
    };
  });
  const incomeCents = addCents(reportMonths.map(month => month.incomeCents));
  const expenseCents = addCents(reportMonths.map(month => month.expenseCents));
  const categories = mergeExpenses(expensesByMonth);

  return {
    from,
    to,
    label: formatReportLabel({ from, to }),
    incomeCents,
    expenseCents,
    balanceCents: addSignedCents(incomeCents, -expenseCents),
    spendingBasisPoints: toBasisPoints(expenseCents, incomeCents),
    months: reportMonths,
    comparison: comparisonMonths(months, byPeriod),
    chartCategories: foldCategories(categories),
    topCategories: categories.slice(0, topLimit),
    empty: incomeCents === 0 && expenseCents === 0,
  };
}

function orderedRange(range: ReportRange): ReportRange {
  return monthIndex(range.from) <= monthIndex(range.to)
    ? range
    : { from: range.to, to: range.from };
}

function monthIndex(period: YearMonth): number {
  return period.year * 12 + period.month;
}

function monthWord(period: YearMonth): string {
  const label = formatPeriodLabel(period);
  const suffix = ` de ${period.year}`;

  return label.endsWith(suffix) ? label.slice(0, -suffix.length) : label;
}

function monthTick(period: YearMonth, spanYears: boolean): string {
  const name = ticks[period.month - 1] ?? '';

  if (!spanYears) {
    return name;
  }

  return `${name}/${String(period.year).slice(-2)}`;
}

function comparisonMonths(
  months: readonly YearMonth[],
  byPeriod: ReadonlyMap<string, MonthlySnapshot>,
): ComparisonMonth[] {
  const first = months[0];
  const periods =
    months.length === 1 && first
      ? uniquePeriods([shiftYearMonth(first, -1), first])
      : [...months];

  return periods.map((period, index) => {
    const snapshot = byPeriod.get(formatYearMonth(period.year, period.month));
    const balanceCents = snapshot?.balanceCents ?? 0;
    const previous = index === 0 ? null : periods[index - 1];
    const previousBalance =
      previous === null || previous === undefined
        ? null
        : (byPeriod.get(formatYearMonth(previous.year, previous.month))
            ?.balanceCents ?? 0);

    return {
      year: period.year,
      month: period.month,
      label: formatPeriodLabel(period),
      incomeCents: snapshot?.incomeCents ?? 0,
      expenseCents: snapshot?.expenseCents ?? 0,
      balanceCents,
      balanceDeltaCents:
        previousBalance === null
          ? null
          : addSignedCents(balanceCents, -previousBalance),
    };
  });
}

function uniquePeriods(periods: readonly YearMonth[]): YearMonth[] {
  const seen = new Set<string>();

  return periods.filter(period => {
    const id = formatYearMonth(period.year, period.month);

    if (seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

function mergeExpenses(
  expensesByMonth: readonly (readonly CategoryExpense[])[],
): CategoryExpense[] {
  const totals = new Map<string, { name: string; spentCents: number }>();

  for (const month of expensesByMonth) {
    for (const expense of month) {
      const current = totals.get(expense.categoryId);
      totals.set(expense.categoryId, {
        name: expense.categoryName,
        spentCents: addCents([current?.spentCents ?? 0, expense.spentCents]),
      });
    }
  }

  const total = addCents([...totals.values()].map(item => item.spentCents));

  return [...totals.entries()]
    .map(([categoryId, item]) => ({
      categoryId,
      categoryName: item.name,
      spentCents: item.spentCents,
      basisPoints: toBasisPoints(item.spentCents, total),
    }))
    .sort(
      (left, right) =>
        right.spentCents - left.spentCents ||
        left.categoryName.localeCompare(right.categoryName, 'pt-BR'),
    );
}

function foldCategories(
  categories: readonly CategoryExpense[],
): CategoryExpense[] {
  if (categories.length <= topLimit) {
    return [...categories];
  }

  const rest = categories.slice(topLimit);
  const restSpent = addCents(rest.map(item => item.spentCents));
  const total = addCents(categories.map(item => item.spentCents));

  return [
    ...categories.slice(0, topLimit),
    {
      categoryId: 'other-expenses',
      categoryName: 'Outras',
      spentCents: restSpent,
      basisPoints: toBasisPoints(restSpent, total),
    },
  ];
}
