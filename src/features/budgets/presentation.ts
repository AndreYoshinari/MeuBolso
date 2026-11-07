import { calculateBudgetUtilization } from '@/domain/calculations';
import type { Budget, Category, Transaction } from '@/domain/types';
import type { BudgetAlertLevel } from '@/lib/budget-alerts';
import { budgetLevel } from '@/lib/budget-alerts';
import { formatCurrency, subtractCents } from '@/lib/money';

export type BudgetCard = {
  id: string;
  categoryId: string;
  categoryName: string;
  month: number;
  year: number;
  limitCents: number;
  spentCents: number;
  remainingCents: number;
  basisPoints: number | null;
  level: BudgetAlertLevel | null;
};

export function budgetCards(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  categories: readonly Category[],
): BudgetCard[] {
  return budgets
    .map(budget => toBudgetCard(budget, transactions, categories))
    .sort((left, right) =>
      left.categoryName.localeCompare(right.categoryName, 'pt-BR'),
    );
}

export function budgetProgress(basisPoints: number | null): number {
  if (basisPoints === null || basisPoints <= 0) {
    return 0;
  }

  if (basisPoints >= 10_000) {
    return 1;
  }

  return basisPoints / 10_000;
}

export function budgetStatusLabel(
  level: BudgetAlertLevel | null,
  remainingCents: number,
): string | null {
  if (level === 'warning') {
    return 'Perto do limite';
  }

  if (level === 'reached') {
    return remainingCents < 0 ? 'Limite ultrapassado' : 'Limite atingido';
  }

  return null;
}

export function formatRemaining(remainingCents: number): string {
  if (remainingCents < 0) {
    return `Ultrapassou ${formatCurrency(Math.abs(remainingCents))}`;
  }

  return `Restam ${formatCurrency(remainingCents)}`;
}

function toBudgetCard(
  budget: Budget,
  transactions: readonly Transaction[],
  categories: readonly Category[],
): BudgetCard {
  const utilization = calculateBudgetUtilization(budget, transactions);

  return {
    id: budget.id,
    categoryId: budget.categoryId,
    categoryName:
      categories.find(category => category.id === budget.categoryId)?.name ??
      'Categoria',
    month: budget.month,
    year: budget.year,
    limitCents: utilization.limitCents,
    spentCents: utilization.spentCents,
    remainingCents: subtractCents(
      utilization.limitCents,
      utilization.spentCents,
    ),
    basisPoints: utilization.basisPoints,
    level: budgetLevel(utilization.basisPoints),
  };
}
