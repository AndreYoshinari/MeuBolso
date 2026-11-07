import { ValidationError } from '@/lib/errors';
import { addCents, subtractCents, toBasisPoints } from '@/lib/money';
import { periodFromCivilDate, type YearMonth } from '@/lib/period';

import type { Budget, Transaction } from '@/domain/types';

export type TransactionGroup<TKey> = {
  key: TKey;
  transactions: Transaction[];
  incomeCents: number;
  expenseCents: number;
};

export type BudgetUtilization = {
  spentCents: number;
  limitCents: number;
  basisPoints: number | null;
};

export function sumIncome(transactions: readonly Transaction[]): number {
  return addCents(amountsOf(transactions, 'income'));
}

export function sumExpenses(transactions: readonly Transaction[]): number {
  return addCents(amountsOf(transactions, 'expense'));
}

export function calculateBalance(transactions: readonly Transaction[]): number {
  return subtractCents(sumIncome(transactions), sumExpenses(transactions));
}

export function calculateSpendingBasisPoints(
  transactions: readonly Transaction[],
): number | null {
  return toBasisPoints(sumExpenses(transactions), sumIncome(transactions));
}

export function calculateBudgetUtilization(
  budget: Budget,
  transactions: readonly Transaction[],
): BudgetUtilization {
  const spentCents = sumExpenses(
    transactions.filter(transaction => matchesBudget(transaction, budget)),
  );

  return {
    spentCents,
    limitCents: budget.amountCents,
    basisPoints: toBasisPoints(spentCents, budget.amountCents),
  };
}

export function countTransactionsByCategory(
  transactions: readonly Transaction[],
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const transaction of transactions) {
    counts[transaction.categoryId] = (counts[transaction.categoryId] ?? 0) + 1;
  }

  return counts;
}

export function groupTransactionsByCategory(
  transactions: readonly Transaction[],
): TransactionGroup<string>[] {
  return groupBy(transactions, transaction => transaction.categoryId).sort(
    (left, right) => left.key.localeCompare(right.key),
  );
}

export function groupTransactionsByPeriod(
  transactions: readonly Transaction[],
): TransactionGroup<YearMonth>[] {
  return groupBy(transactions, transaction => {
    const period = periodFromCivilDate(transaction.date);

    if (!period) {
      throw new ValidationError([{ field: 'date', message: 'Data inválida.' }]);
    }

    return periodKey(period);
  })
    .map(group => ({
      ...group,
      key: parsePeriodKey(group.key),
    }))
    .sort((left, right) => {
      if (left.key.year !== right.key.year) {
        return left.key.year - right.key.year;
      }

      return left.key.month - right.key.month;
    });
}

function amountsOf(
  transactions: readonly Transaction[],
  type: Transaction['type'],
): number[] {
  return transactions
    .filter(transaction => transaction.type === type)
    .map(transaction => transaction.amountCents);
}

function matchesBudget(transaction: Transaction, budget: Budget): boolean {
  if (
    transaction.type !== 'expense' ||
    transaction.categoryId !== budget.categoryId
  ) {
    return false;
  }

  const period = periodFromCivilDate(transaction.date);

  return period?.year === budget.year && period.month === budget.month;
}

function groupBy(
  transactions: readonly Transaction[],
  keyOf: (transaction: Transaction) => string,
): TransactionGroup<string>[] {
  const groups = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const key = keyOf(transaction);
    const current = groups.get(key) ?? [];
    current.push(transaction);
    groups.set(key, current);
  }

  return [...groups.entries()].map(([key, grouped]) => ({
    key,
    transactions: grouped,
    incomeCents: sumIncome(grouped),
    expenseCents: sumExpenses(grouped),
  }));
}

function periodKey(period: YearMonth): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`;
}

function parsePeriodKey(key: string): YearMonth {
  const [year, month] = key.split('-');

  return {
    year: Number(year),
    month: Number(month),
  };
}
