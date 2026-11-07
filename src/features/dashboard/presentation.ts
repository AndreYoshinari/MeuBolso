import type { CategoryExpense, FinancialSummary } from '@/domain';

export type IncomeExpenseBar = {
  label: string;
  value: number;
  tone: 'income' | 'expense';
};

export type CategorySlice = {
  id: string;
  name: string;
  value: number;
  color: string;
  basisPoints: number | null;
};

export function greetingForHour(hour: number, displayName = ''): string {
  const greeting = greetingForCivilHour(hour);
  const name = displayName.trim();

  return name ? `${greeting}, ${name}` : greeting;
}

function greetingForCivilHour(hour: number): string {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return 'Olá';
  }

  if (hour < 12) {
    return 'Bom dia';
  }

  if (hour < 18) {
    return 'Boa tarde';
  }

  return 'Boa noite';
}

export function isEmptyPeriod(
  summary: Pick<FinancialSummary, 'incomeCents' | 'expenseCents'>,
): boolean {
  return summary.incomeCents === 0 && summary.expenseCents === 0;
}

export function incomeExpenseBars(
  summary: Pick<FinancialSummary, 'incomeCents' | 'expenseCents'>,
): IncomeExpenseBar[] {
  return [
    { label: 'Receitas', value: summary.incomeCents, tone: 'income' },
    { label: 'Despesas', value: summary.expenseCents, tone: 'expense' },
  ];
}

export function barChartMax(bars: readonly { value: number }[]): number {
  return Math.max(1, ...bars.map(bar => bar.value));
}

export function categorySlices(
  expenses: readonly CategoryExpense[],
  colors: readonly string[],
): CategorySlice[] {
  const palette = colors.length > 0 ? colors : ['#7C6AF7'];

  return expenses.map((expense, index) => ({
    id: expense.categoryId,
    name: expense.categoryName,
    value: expense.spentCents,
    color: palette[index % palette.length] ?? palette[0],
    basisPoints: expense.basisPoints,
  }));
}

export { formatShare } from '@/lib/percent';
