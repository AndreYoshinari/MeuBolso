import { ValidationError } from '@/lib/errors';

import type {
  BudgetRepository,
  CategoryRepository,
  TransactionRepository,
} from '@/domain/repositories';
import type { Category } from '@/domain/types';
import { unwrap, unwrapFound } from '@/domain/usecases/guard';
import { validateCategory } from '@/domain/rules';

export type CategoryDeps = {
  categories: CategoryRepository;
  transactions: TransactionRepository;
  budgets: BudgetRepository;
  ids: () => string;
};

export async function getCategories(deps: CategoryDeps): Promise<Category[]> {
  const categories = await deps.categories.list();

  return categories.sort((left, right) =>
    left.name.localeCompare(right.name, 'pt-BR'),
  );
}

export async function createCategory(
  deps: CategoryDeps,
  input: unknown,
): Promise<Category> {
  const category = unwrap(
    validateCategory({
      ...normalizeCategoryInput(input),
      id: deps.ids(),
      isDefault: false,
    }),
  );

  await assertUniqueCategory(deps, category);
  await deps.categories.save(category);

  return category;
}

export async function updateCategory(
  deps: CategoryDeps,
  id: string,
  input: unknown,
): Promise<Category> {
  const current = unwrapFound(
    await deps.categories.findById(id),
    'Categoria não encontrada.',
  );
  const category = unwrap(
    validateCategory({
      ...normalizeCategoryInput(input),
      id: current.id,
      isDefault: current.isDefault,
    }),
  );

  if (category.type !== current.type) {
    await assertTypeCanChange(deps, id);
  }

  await assertUniqueCategory(deps, category);
  await deps.categories.save(category);

  return category;
}

export async function deleteCategory(
  deps: CategoryDeps,
  id: string,
): Promise<void> {
  const current = unwrapFound(
    await deps.categories.findById(id),
    'Categoria não encontrada.',
  );

  if (current.isDefault) {
    throw new ValidationError([
      {
        field: 'id',
        message: 'Categoria padrão não pode ser excluída.',
      },
    ]);
  }

  const [transactions, budgets] = await Promise.all([
    deps.transactions.list(),
    deps.budgets.list(),
  ]);
  const inUse =
    transactions.some(transaction => transaction.categoryId === id) ||
    budgets.some(budget => budget.categoryId === id);

  if (inUse) {
    throw new ValidationError([
      {
        field: 'id',
        message: 'Categoria em uso não pode ser excluída.',
      },
    ]);
  }

  await deps.categories.remove(id);
}

function normalizeCategoryInput(input: unknown): Record<string, unknown> {
  const fields = asFields(input);

  if (typeof fields.name !== 'string') {
    return fields;
  }

  return { ...fields, name: fields.name.trim() };
}

async function assertUniqueCategory(
  deps: CategoryDeps,
  category: Category,
): Promise<void> {
  const categories = await deps.categories.list();
  const name = category.name.toLocaleLowerCase('pt-BR');
  const duplicate = categories.some(
    item =>
      item.id !== category.id &&
      item.type === category.type &&
      item.name.trim().toLocaleLowerCase('pt-BR') === name,
  );

  if (duplicate) {
    throw new ValidationError([
      {
        field: 'name',
        message: 'Já existe uma categoria com este nome e tipo.',
      },
    ]);
  }
}

async function assertTypeCanChange(
  deps: CategoryDeps,
  id: string,
): Promise<void> {
  const [transactions, budgets] = await Promise.all([
    deps.transactions.list(),
    deps.budgets.list(),
  ]);

  if (transactions.some(transaction => transaction.categoryId === id)) {
    throw new ValidationError([
      {
        field: 'type',
        message: 'Não é possível mudar o tipo de uma categoria em uso.',
      },
    ]);
  }

  if (budgets.some(budget => budget.categoryId === id)) {
    throw new ValidationError([
      {
        field: 'type',
        message:
          'Não é possível mudar o tipo de uma categoria usada em orçamento.',
      },
    ]);
  }
}

function asFields(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
}
