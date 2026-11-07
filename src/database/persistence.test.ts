import { DatabaseError } from '@/lib/errors';

import { createTransaction } from '@/domain';
import { defaultUserPreferences } from '@/domain/preferences';
import type { Budget, Category, Transaction } from '@/domain/types';
import { clearUserTables } from '@/database/clear-user-data';
import { initializeDatabase } from '@/database/initialize';
import { createNodeDatabaseClient } from '@/database/node-client';

const timestamp = '2026-03-01T12:00:00.000Z';

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 'custom-gifts',
    name: 'Presentes',
    icon: 'expense',
    color: '#FF6B7A',
    type: 'expense',
    isDefault: false,
    ...overrides,
  };
}

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Mercado',
    amountCents: 18690,
    type: 'expense',
    categoryId: 'default-food',
    date: '2026-03-01',
    notes: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-1',
    categoryId: 'default-food',
    amountCents: 50000,
    month: 3,
    year: 2026,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

const clients: { close: () => void }[] = [];

function openClient() {
  const client = createNodeDatabaseClient();
  clients.push(client);
  return client;
}

async function openDatabase() {
  return initializeDatabase(openClient());
}

afterEach(() => {
  while (clients.length > 0) {
    clients.pop()?.close();
  }
});

test('creates default categories and preferences once', async () => {
  const client = openClient();
  const repositories = await initializeDatabase(client);
  const categories = await repositories.categories.list();

  expect(categories).toHaveLength(13);
  expect(categories.every(item => item.isDefault)).toBe(true);
  expect(categories.map(item => item.name)).toEqual(
    expect.arrayContaining([
      'Salário',
      'Investimentos',
      'Freelance',
      'Outros ganhos',
      'Alimentação',
      'Moradia',
      'Transporte',
      'Saúde',
      'Educação',
      'Lazer',
      'Compras',
      'Contas',
      'Outros gastos',
    ]),
  );
  expect(await repositories.preferences.get()).toEqual(defaultUserPreferences);

  await repositories.categories.save(category());
  await initializeDatabase(client);

  expect(await repositories.categories.findById('custom-gifts')).toMatchObject({
    name: 'Presentes',
  });
  expect(await repositories.categories.list()).toHaveLength(14);
  expect(
    await client.all<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version',
    ),
  ).toEqual([
    { version: 1 },
    { version: 2 },
    { version: 3 },
    { version: 4 },
    { version: 5 },
  ]);

  await expect(
    repositories.categories.remove('default-salary'),
  ).rejects.toBeInstanceOf(DatabaseError);
  expect(
    await repositories.categories.findById('default-salary'),
  ).not.toBeNull();
});

test('creates, reads, updates and deletes a transaction', async () => {
  const repositories = await openDatabase();
  const created = await createTransaction(
    {
      ...repositories,
      ids: () => 'tx-1',
      now: () => timestamp,
    },
    {
      description: 'Mercado',
      amountCents: 18690,
      type: 'expense',
      categoryId: 'default-food',
      date: '2026-03-01',
      notes: 'feira',
    },
  );

  expect(await repositories.transactions.findById(created.id)).toEqual(created);

  const updated = {
    ...created,
    description: 'Feira',
    amountCents: 20000,
    updatedAt: '2026-03-02T12:00:00.000Z',
  };
  await repositories.transactions.save(updated);

  expect(await repositories.transactions.findById(created.id)).toEqual(updated);
  expect(
    await repositories.transactions.listByPeriod({ year: 2026, month: 3 }),
  ).toEqual([updated]);

  await repositories.transactions.save(
    transaction({ id: 'tx-april', description: 'Abril', date: '2026-04-01' }),
  );
  expect(
    (
      await repositories.transactions.listByPeriod({ year: 2026, month: 3 })
    ).map(item => item.id),
  ).toEqual(['tx-1']);
  expect(await repositories.transactions.countByCategory()).toEqual({
    'default-food': 2,
  });

  await repositories.transactions.remove(created.id);
  expect(await repositories.transactions.countByCategory()).toEqual({
    'default-food': 1,
  });

  expect(await repositories.transactions.findById(created.id)).toBeNull();
});

test('creates, reads, updates and deletes a category', async () => {
  const repositories = await openDatabase();
  const created = category();

  await repositories.categories.save(created);
  expect(await repositories.categories.findById(created.id)).toEqual(created);

  const renamed = { ...created, name: 'Doações' };
  await repositories.categories.save(renamed);
  expect(await repositories.categories.findById(created.id)).toEqual(renamed);

  await repositories.categories.remove(created.id);
  expect(await repositories.categories.findById(created.id)).toBeNull();
});

test('creates, reads, updates and deletes a budget', async () => {
  const repositories = await openDatabase();
  const created = budget();

  await repositories.budgets.save(created);
  expect(await repositories.budgets.findById(created.id)).toEqual(created);
  expect(
    await repositories.budgets.listByPeriod({ year: 2026, month: 3 }),
  ).toEqual([created]);

  const updated = {
    ...created,
    amountCents: 60000,
    updatedAt: '2026-03-02T12:00:00.000Z',
  };
  await repositories.budgets.save(updated);
  expect(await repositories.budgets.findById(created.id)).toEqual(updated);

  await repositories.budgets.remove(created.id);
  expect(await repositories.budgets.findById(created.id)).toBeNull();
});

test('updates preferences', async () => {
  const repositories = await openDatabase();

  await repositories.preferences.save({
    ...defaultUserPreferences,
    displayName: 'Ana',
    theme: 'light',
    notificationsEnabled: true,
    reminderDay: 5,
    reminderHour: 18,
    onboardingCompleted: true,
  });

  expect(await repositories.preferences.get()).toEqual({
    ...defaultUserPreferences,
    displayName: 'Ana',
    theme: 'light',
    notificationsEnabled: true,
    reminderDay: 5,
    reminderHour: 18,
    onboardingCompleted: true,
  });
});

test('clears user data and restores the default preferences', async () => {
  const client = openClient();
  const repositories = await initializeDatabase(client);

  await repositories.categories.save(category());
  await repositories.transactions.save(transaction());
  await repositories.budgets.save(budget());
  await repositories.rates.saveAll([
    {
      base: 'USD',
      quote: 'BRL',
      rate: '5.00',
      quotedOn: '2026-03-01',
      fetchedAt: timestamp,
    },
  ]);
  await repositories.preferences.save({
    ...defaultUserPreferences,
    displayName: 'Ana',
    theme: 'light',
    notificationsEnabled: true,
  });

  await clearUserTables(client);

  expect(await repositories.transactions.list()).toEqual([]);
  expect(await repositories.budgets.list()).toEqual([]);
  expect(await repositories.rates.list()).toEqual([]);
  expect(await repositories.categories.list()).toHaveLength(13);
  expect(await repositories.categories.findById('custom-gifts')).toBeNull();
  expect(await repositories.preferences.get()).toEqual(defaultUserPreferences);
});

test('rejects inconsistent data and rolls back a failed transaction', async () => {
  const client = openClient();
  const repositories = await initializeDatabase(client);

  await expect(
    repositories.transactions.save(transaction({ amountCents: 0 })),
  ).rejects.toBeInstanceOf(DatabaseError);
  await expect(
    repositories.transactions.save(
      transaction({
        id: 'tx-income',
        type: 'income',
        categoryId: 'default-food',
      }),
    ),
  ).rejects.toBeInstanceOf(DatabaseError);
  await expect(
    repositories.budgets.save(budget({ categoryId: 'default-salary' })),
  ).rejects.toBeInstanceOf(DatabaseError);

  await repositories.budgets.save(budget());
  await expect(
    repositories.budgets.save(budget({ id: 'budget-2' })),
  ).rejects.toBeInstanceOf(DatabaseError);

  await repositories.transactions.save(transaction());
  await expect(
    repositories.categories.remove('default-food'),
  ).rejects.toBeInstanceOf(DatabaseError);
  expect(await repositories.categories.findById('default-food')).not.toBeNull();

  await expect(
    client.transaction(async () => {
      await repositories.categories.save(category({ id: 'rolled-back' }));
      throw new Error('falha');
    }),
  ).rejects.toThrow('falha');
  expect(await repositories.categories.findById('rolled-back')).toBeNull();
});

test('saves and reads an exchange rate without converting it to a float', async () => {
  const repositories = await openDatabase();

  await repositories.rates.saveAll([
    {
      base: 'USD',
      quote: 'BRL',
      rate: '5.4321',
      quotedOn: '2026-03-01',
      fetchedAt: '2026-03-01T12:00:00.000Z',
    },
  ]);

  expect(await repositories.rates.list()).toEqual([
    {
      base: 'USD',
      quote: 'BRL',
      rate: '5.4321',
      quotedOn: '2026-03-01',
      fetchedAt: '2026-03-01T12:00:00.000Z',
    },
  ]);
});
