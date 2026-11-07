import { calculateBudgetUtilization } from '@/domain/calculations';
import type { Budget, Category, Transaction } from '@/domain/types';

export type BudgetAlertLevel = 'warning' | 'reached';

export type BudgetAlert = {
  categoryId: string;
  categoryName: string;
  level: BudgetAlertLevel;
  year: number;
  month: number;
};

const WARNING_BASIS_POINTS = 8000;
const REACHED_BASIS_POINTS = 10000;

export function budgetLevel(
  basisPoints: number | null,
): BudgetAlertLevel | null {
  if (basisPoints === null || basisPoints < WARNING_BASIS_POINTS) {
    return null;
  }

  if (basisPoints >= REACHED_BASIS_POINTS) {
    return 'reached';
  }

  return 'warning';
}

export function budgetAlerts(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  categories: readonly Category[],
): BudgetAlert[] {
  return budgets.flatMap(budget => {
    const utilization = calculateBudgetUtilization(budget, transactions);
    const level = budgetLevel(utilization.basisPoints);

    if (!level) {
      return [];
    }

    return [
      {
        categoryId: budget.categoryId,
        categoryName:
          categories.find(category => category.id === budget.categoryId)
            ?.name ?? 'Categoria',
        level,
        year: budget.year,
        month: budget.month,
      },
    ];
  });
}
