import { ValidationError } from '@/lib/errors';
import {
  calculateBalance,
  groupTransactionsByCategory,
  sumExpenses,
  sumIncome,
} from '@/domain/calculations';
import type { AmountKind } from '@/lib/money';
import { toBasisPoints } from '@/lib/money';
import { periodFromCivilDate, type YearMonth } from '@/lib/period';

import type {
  CategoryRepository,
  TransactionRepository,
} from '@/domain/repositories';
import type { Transaction } from '@/domain/types';
import { requirePeriod } from '@/domain/usecases/guard';

export type DashboardDeps = {
  transactions: TransactionRepository;
  categories: CategoryRepository;
};

export type FinancialSummary = {
  period: YearMonth;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  spendingBasisPoints: number | null;
};

export type CategoryExpense = {
  categoryId: string;
  categoryName: string;
  spentCents: number;
  basisPoints: number | null;
};

export type MonthlySnapshot = {
  year: number;
  month: number;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
};

export type RecentTransaction = {
  id: string;
  description: string;
  amountCents: number;
  type: AmountKind;
  categoryName: string;
  date: string;
};

const recentLimit = 5;

export async function getTotalBalance(deps: DashboardDeps): Promise<number> {
  return calculateBalance(await deps.transactions.list());
}

export async function getRecentTransactions(
  deps: DashboardDeps,
  period: unknown,
): Promise<RecentTransaction[]> {
  const transactions = await deps.transactions.listByPeriod(
    requirePeriod(period),
  );
  const categories = await deps.categories.list();

  return transactions
    .sort(byRecentDate)
    .slice(0, recentLimit)
    .map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amountCents: transaction.amountCents,
      type: transaction.type,
      categoryName:
        categories.find(category => category.id === transaction.categoryId)
          ?.name ?? 'Categoria removida',
      date: transaction.date,
    }));
}

export async function getFinancialSummary(
  deps: DashboardDeps,
  period: unknown,
): Promise<FinancialSummary> {
  const validPeriod = requirePeriod(period);
  const transactions = await deps.transactions.listByPeriod(validPeriod);
  const incomeCents = sumIncome(transactions);
  const expenseCents = sumExpenses(transactions);

  return {
    period: validPeriod,
    incomeCents,
    expenseCents,
    balanceCents: calculateBalance(transactions),
    spendingBasisPoints: toBasisPoints(expenseCents, incomeCents),
  };
}

export async function getExpensesByCategory(
  deps: DashboardDeps,
  period: unknown,
): Promise<CategoryExpense[]> {
  const transactions = await deps.transactions.listByPeriod(
    requirePeriod(period),
  );
  const categories = await deps.categories.list();
  const totalExpenses = sumExpenses(transactions);

  return groupTransactionsByCategory(transactions)
    .filter(group => group.expenseCents > 0)
    .map(group => ({
      categoryId: group.key,
      categoryName:
        categories.find(category => category.id === group.key)?.name ??
        'Categoria removida',
      spentCents: group.expenseCents,
      basisPoints: toBasisPoints(group.expenseCents, totalExpenses),
    }))
    .sort((left, right) => right.spentCents - left.spentCents);
}

export async function getMonthlyFinancialHistory(
  deps: DashboardDeps,
  year: unknown,
): Promise<MonthlySnapshot[]> {
  if (
    typeof year !== 'number' ||
    !Number.isInteger(year) ||
    year < 1 ||
    year > 9999
  ) {
    throw new ValidationError([
      { field: 'year', message: 'Informe um ano válido.' },
    ]);
  }

  const transactions = (await deps.transactions.list()).filter(transaction =>
    inYear(transaction, year),
  );

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthly = transactions.filter(transaction =>
      inMonth(transaction, year, month),
    );

    return {
      year,
      month,
      incomeCents: sumIncome(monthly),
      expenseCents: sumExpenses(monthly),
      balanceCents: calculateBalance(monthly),
    };
  });
}

function inYear(transaction: Transaction, year: number): boolean {
  return periodFromCivilDate(transaction.date)?.year === year;
}

function inMonth(
  transaction: Transaction,
  year: number,
  month: number,
): boolean {
  const period = periodFromCivilDate(transaction.date);

  return period?.year === year && period.month === month;
}

function byRecentDate(left: Transaction, right: Transaction): number {
  if (left.date !== right.date) {
    return right.date.localeCompare(left.date);
  }

  return right.id.localeCompare(left.id);
}
