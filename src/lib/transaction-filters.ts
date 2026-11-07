import type { Transaction } from '@/domain/types';
import type { AmountKind } from '@/lib/money';
import {
  civilMonthRange,
  daysInMonth,
  formatCivilDate,
  formatPeriodLabel,
  formatYearMonth,
  isCivilDate,
  parseCivilDate,
  periodStart,
  type YearMonth,
} from '@/lib/period';

export type TransactionFilters = {
  type?: AmountKind;
  categoryId?: string;
  query?: string;
  from: string;
  to: string;
};

export function defaultTransactionFilters(now: Date): TransactionFilters {
  const range = civilMonthRange(now);

  return { from: range.from, to: range.to };
}

export function parseTransactionSearchParams(
  params: unknown,
  now: Date,
): TransactionFilters {
  const record = asRecord(params);
  const fallback = defaultTransactionFilters(now);
  const from = civilParam(record?.from) ?? fallback.from;
  const to = civilParam(record?.to) ?? fallback.to;
  const type = readType(record?.type);
  const categoryId = readText(record?.categoryId);
  const query = readText(record?.q);

  return {
    type,
    categoryId,
    query,
    from,
    to: to < from ? from : to,
  };
}

export function hasTransactionSearchParams(params: unknown): boolean {
  const record = asRecord(params);

  if (!record) {
    return false;
  }

  return (
    readText(record.type) !== undefined ||
    readText(record.categoryId) !== undefined ||
    readText(record.q) !== undefined ||
    readText(record.from) !== undefined ||
    readText(record.to) !== undefined
  );
}

export function filtersForMonth(
  current: TransactionFilters,
  period: YearMonth,
): TransactionFilters {
  const lastDay = String(daysInMonth(period.year, period.month)).padStart(
    2,
    '0',
  );

  return {
    ...current,
    from: periodStart(period.year, period.month),
    to: `${formatYearMonth(period.year, period.month)}-${lastDay}`,
  };
}

export function periodLabelForFilters(filters: TransactionFilters): string {
  const from = parseCivilDate(filters.from);
  const to = parseCivilDate(filters.to);
  const fullMonth =
    from !== null &&
    to !== null &&
    from.year === to.year &&
    from.month === to.month &&
    from.day === 1 &&
    to.day === daysInMonth(from.year, from.month);

  if (fullMonth && from) {
    return formatPeriodLabel({ year: from.year, month: from.month });
  }

  return `${formatCivilDate(filters.from)} a ${formatCivilDate(filters.to)}`;
}

export function selectTransactions(
  transactions: readonly Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  const query = filters.query?.trim().toLocaleLowerCase('pt-BR');

  return transactions.filter(transaction => {
    if (
      query &&
      !transaction.description.toLocaleLowerCase('pt-BR').includes(query)
    ) {
      return false;
    }

    if (filters.type && transaction.type !== filters.type) {
      return false;
    }

    if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
      return false;
    }

    return transaction.date >= filters.from && transaction.date <= filters.to;
  });
}

function asRecord(params: unknown): Record<string, unknown> | null {
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    return null;
  }

  return params as Record<string, unknown>;
}

function readText(value: unknown): string | undefined {
  const text = Array.isArray(value) ? value[0] : value;

  if (typeof text !== 'string') {
    return undefined;
  }

  const trimmed = text.trim();

  return trimmed === '' ? undefined : trimmed;
}

function readType(value: unknown): AmountKind | undefined {
  const text = readText(value);

  if (text === 'income' || text === 'expense') {
    return text;
  }

  return undefined;
}

function civilParam(value: unknown): string | undefined {
  const text = readText(value);

  return text && isCivilDate(text) ? text : undefined;
}
