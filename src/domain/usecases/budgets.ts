import type {
  BudgetRepository,
  CategoryRepository,
} from '@/domain/repositories';
import type { Budget } from '@/domain/types';
import { unwrap, unwrapFound, requirePeriod } from '@/domain/usecases/guard';
import { validateBudget } from '@/domain/rules';

export type BudgetDeps = {
  budgets: BudgetRepository;
  categories: CategoryRepository;
  ids: () => string;
  now: () => string;
};

export async function createBudget(
  deps: BudgetDeps,
  input: unknown,
): Promise<Budget> {
  const now = deps.now();
  const budget = unwrap(
    validateBudget(
      {
        ...asFields(input),
        id: deps.ids(),
        createdAt: now,
        updatedAt: now,
      },
      await deps.categories.list(),
      await deps.budgets.list(),
    ),
  );

  await deps.budgets.save(budget);

  return budget;
}

export async function updateBudget(
  deps: BudgetDeps,
  id: string,
  input: unknown,
): Promise<Budget> {
  const current = unwrapFound(
    await deps.budgets.findById(id),
    'Orçamento não encontrado.',
  );
  const budget = unwrap(
    validateBudget(
      {
        ...asFields(input),
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: deps.now(),
      },
      await deps.categories.list(),
      await deps.budgets.list(),
    ),
  );

  await deps.budgets.save(budget);

  return budget;
}

export async function deleteBudget(
  deps: BudgetDeps,
  id: string,
): Promise<void> {
  unwrapFound(await deps.budgets.findById(id), 'Orçamento não encontrado.');
  await deps.budgets.remove(id);
}

export async function getBudgetsByPeriod(
  deps: BudgetDeps,
  period: unknown,
): Promise<Budget[]> {
  const budgets = await deps.budgets.listByPeriod(requirePeriod(period));

  return budgets.sort((left, right) =>
    left.categoryId.localeCompare(right.categoryId),
  );
}

function asFields(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
}
