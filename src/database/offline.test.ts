import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createBudget,
  createTransaction,
  getBudgetsByPeriod,
  getCategories,
  getFinancialSummary,
  getTransactionsByPeriod,
} from '@/domain';
import { initializeDatabase } from '@/database/initialize';
import { createNodeDatabaseClient } from '@/database/node-client';
import { DatabaseError } from '@/lib/errors';

const timestamp = '2026-03-01T12:00:00.000Z';

test('keeps the ledger usable without a network and after reopening the file', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch');
  const directory = mkdtempSync(join(tmpdir(), 'meubolso-'));
  const filename = join(directory, 'meubolso.db');
  const first = createNodeDatabaseClient(filename);

  try {
    const repositories = await initializeDatabase(first);
    const deps = {
      ...repositories,
      ids: sequence(['tx-1', 'budget-1']),
      now: () => timestamp,
    };

    await createTransaction(deps, {
      description: 'Mercado',
      amountCents: 18690,
      type: 'expense',
      categoryId: 'default-food',
      date: '2026-03-10',
      notes: '',
    });
    await createBudget(deps, {
      categoryId: 'default-food',
      amountCents: 50000,
      month: 3,
      year: 2026,
    });

    await expect(
      getFinancialSummary(deps, { year: 2026, month: 3 }),
    ).resolves.toMatchObject({
      incomeCents: 0,
      expenseCents: 18690,
      balanceCents: -18690,
    });
    await expect(
      getTransactionsByPeriod(deps, { year: 2026, month: 3 }),
    ).resolves.toHaveLength(1);
    await expect(
      getTransactionsByPeriod(deps, { year: 2026, month: 4 }),
    ).resolves.toEqual([]);
    await expect(
      getBudgetsByPeriod(deps, { year: 2026, month: 3 }),
    ).resolves.toMatchObject([{ amountCents: 50000 }]);
    await expect(getCategories(deps)).resolves.toHaveLength(13);
    expect(fetchSpy).not.toHaveBeenCalled();

    await expect(
      repositories.transactions.save({
        id: 'broken',
        description: 'Inválido',
        amountCents: 0,
        type: 'expense',
        categoryId: 'default-food',
        date: '2026-03-11',
        notes: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    ).rejects.toBeInstanceOf(DatabaseError);
    expect(await repositories.transactions.list()).toHaveLength(1);

    first.close();
    const second = createNodeDatabaseClient(filename);
    const reopened = await initializeDatabase(second);

    expect(await reopened.transactions.findById('tx-1')).toMatchObject({
      description: 'Mercado',
      amountCents: 18690,
    });
    expect(await reopened.budgets.findById('budget-1')).toMatchObject({
      amountCents: 50000,
    });
    second.close();
  } finally {
    first.close();
    fetchSpy.mockRestore();
    rmSync(directory, { recursive: true, force: true });
  }
});

function sequence(values: string[]): () => string {
  const pending = [...values];

  return () => {
    const next = pending.shift();

    if (!next) {
      throw new Error('ids esgotados');
    }

    return next;
  };
}
