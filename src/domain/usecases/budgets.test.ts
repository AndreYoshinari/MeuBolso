import { NotFoundError, ValidationError } from '@/lib/errors';

import {
  createBudget,
  deleteBudget,
  getBudgetsByPeriod,
  updateBudget,
} from '@/domain';
import { createTestDeps } from '@/domain/testing/test-deps';
import type { Category } from '@/domain/types';

const food: Category = {
  id: 'food',
  name: 'Alimentação',
  icon: 'expense',
  color: '#FF6B7A',
  type: 'expense',
  isDefault: true,
};

const salary: Category = {
  id: 'salary',
  name: 'Salário',
  icon: 'income',
  color: '#3DDC97',
  type: 'income',
  isDefault: true,
};

const budgetInput = {
  categoryId: 'food',
  amountCents: 50000,
  month: 3,
  year: 2026,
};

test('creates a budget and rejects invalid or duplicated ones', async () => {
  const deps = createTestDeps();
  await deps.categories.save(food);
  await deps.categories.save(salary);

  const created = await createBudget(deps, budgetInput);

  expect(created.amountCents).toBe(50000);
  await expect(createBudget(deps, budgetInput)).rejects.toThrow(
    ValidationError,
  );
  await expect(
    createBudget(deps, { ...budgetInput, categoryId: 'salary', month: 4 }),
  ).rejects.toThrow(ValidationError);
  expect(await deps.budgets.list()).toHaveLength(1);
});

test('updates, lists and deletes a budget by period', async () => {
  const deps = createTestDeps();
  await deps.categories.save(food);
  const created = await createBudget(deps, budgetInput);
  await createBudget(deps, { ...budgetInput, month: 4 });

  const updated = await updateBudget(deps, created.id, {
    ...budgetInput,
    amountCents: 60000,
  });

  expect(updated.amountCents).toBe(60000);
  expect(updated.createdAt).toBe(created.createdAt);

  const march = await getBudgetsByPeriod(deps, { year: 2026, month: 3 });

  expect(march).toHaveLength(1);
  await deleteBudget(deps, created.id);
  expect(await getBudgetsByPeriod(deps, { year: 2026, month: 3 })).toEqual([]);
  await expect(deleteBudget(deps, created.id)).rejects.toThrow(NotFoundError);
});
