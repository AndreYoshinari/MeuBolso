import { NotFoundError, ValidationError } from '@/lib/errors';

import {
  createCategory,
  createTransaction,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
} from '@/domain';
import { createTestDeps } from '@/domain/testing/test-deps';

const categoryInput = {
  name: 'Alimentação',
  icon: 'expense',
  color: '#FF6B7A',
  type: 'expense' as const,
  isDefault: false,
};

test('creates and lists categories by name', async () => {
  const deps = createTestDeps();
  await createCategory(deps, { ...categoryInput, name: 'Transporte' });
  await createCategory(deps, categoryInput);

  expect((await getCategories(deps)).map(category => category.name)).toEqual([
    'Alimentação',
    'Transporte',
  ]);
});

test('blocks type change and deletion while the category is in use', async () => {
  const deps = createTestDeps();
  const category = await createCategory(deps, categoryInput);
  await createTransaction(deps, {
    description: 'Mercado',
    amountCents: 1000,
    type: 'expense',
    categoryId: category.id,
    date: '2026-03-01',
    notes: '',
  });

  await expect(
    updateCategory(deps, category.id, { ...categoryInput, type: 'income' }),
  ).rejects.toThrow(ValidationError);
  await expect(deleteCategory(deps, category.id)).rejects.toThrow(
    ValidationError,
  );
  expect(await deps.categories.findById(category.id)).not.toBeNull();
});

test('blocks deletion when a budget still uses the category', async () => {
  const deps = createTestDeps();
  const category = await createCategory(deps, categoryInput);

  await deps.budgets.save({
    id: 'budget-1',
    categoryId: category.id,
    amountCents: 1000,
    month: 3,
    year: 2026,
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  });

  await expect(deleteCategory(deps, category.id)).rejects.toThrow(
    ValidationError,
  );
});

test('deletes an unused category and rejects a missing one', async () => {
  const deps = createTestDeps();
  const category = await createCategory(deps, categoryInput);

  await deleteCategory(deps, category.id);

  expect(await deps.categories.findById(category.id)).toBeNull();
  await expect(deleteCategory(deps, category.id)).rejects.toThrow(
    NotFoundError,
  );
});

test('rejects a duplicate name for the same type and keeps the other type', async () => {
  const deps = createTestDeps();
  await createCategory(deps, categoryInput);

  await expect(
    createCategory(deps, { ...categoryInput, name: ' alimentação ' }),
  ).rejects.toThrow('Já existe uma categoria com este nome e tipo.');
  await expect(
    createCategory(deps, { ...categoryInput, type: 'income' }),
  ).resolves.toMatchObject({ name: 'Alimentação', type: 'income' });
});

test('keeps a default category and its default flag', async () => {
  const deps = createTestDeps();
  const category = await createCategory(deps, {
    ...categoryInput,
    isDefault: true,
  });

  expect(category.isDefault).toBe(false);

  await deps.categories.save({ ...category, isDefault: true });

  await expect(deleteCategory(deps, category.id)).rejects.toThrow(
    'Categoria padrão não pode ser excluída.',
  );
  expect(await deps.categories.findById(category.id)).toMatchObject({
    isDefault: true,
  });

  const renamed = await updateCategory(deps, category.id, {
    ...categoryInput,
    isDefault: false,
    name: 'Salário',
  });

  expect(renamed.isDefault).toBe(true);
  expect(renamed.name).toBe('Salário');
});

test('blocks a type change when a budget uses the category', async () => {
  const deps = createTestDeps();
  const category = await createCategory(deps, categoryInput);

  await deps.budgets.save({
    id: 'budget-1',
    categoryId: category.id,
    amountCents: 1000,
    month: 3,
    year: 2026,
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  });

  await expect(
    updateCategory(deps, category.id, { ...categoryInput, type: 'income' }),
  ).rejects.toThrow(
    'Não é possível mudar o tipo de uma categoria usada em orçamento.',
  );
});

test('keeps a renamed category when it is not in use', async () => {
  const deps = createTestDeps();
  const category: Category = await createCategory(deps, categoryInput);
  const updated = await updateCategory(deps, category.id, {
    ...categoryInput,
    name: 'Mercado',
  });

  expect(updated.name).toBe('Mercado');
  expect(updated.id).toBe(category.id);
});
