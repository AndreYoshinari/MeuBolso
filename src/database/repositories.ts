import type { DatabaseClient } from '@/database/client';
import {
  toBudget,
  toBudgetRow,
  toCategory,
  toCategoryRow,
  toExchangeRate,
  toExchangeRateRow,
  toPreferenceParams,
  toPreferences,
  toTransaction,
  toTransactionRow,
} from '@/database/mappers';
import { createBudgetSource } from '@/database/sources/budget-source';
import { createCategorySource } from '@/database/sources/category-source';
import { createPreferencesSource } from '@/database/sources/preferences-source';
import { createRateSource } from '@/database/sources/rate-source';
import { createTransactionSource } from '@/database/sources/transaction-source';
import type {
  BudgetRepository,
  CategoryRepository,
  ExchangeRateRepository,
  PreferencesRepository,
  Repositories,
  TransactionRepository,
} from '@/domain/repositories';
import { formatYearMonth, nextPeriodStart, periodStart } from '@/lib/period';

export function createSqliteRepositories(client: DatabaseClient): Repositories {
  return {
    transactions: createTransactionRepository(client),
    categories: createCategoryRepository(client),
    budgets: createBudgetRepository(client),
    preferences: createPreferencesRepository(client),
    rates: createExchangeRateRepository(client),
  };
}

function createTransactionRepository(
  client: DatabaseClient,
): TransactionRepository {
  const source = createTransactionSource(client);

  return {
    async list() {
      return (await source.list()).map(toTransaction);
    },
    async findById(id) {
      const row = await source.findById(id);
      return row ? toTransaction(row) : null;
    },
    async listByPeriod(period) {
      const rows = await source.listByPeriod(
        periodStart(period.year, period.month),
        nextPeriodStart(period.year, period.month),
      );

      return rows.map(toTransaction);
    },
    async countByCategory() {
      const rows = await source.countByCategory();
      const counts: Record<string, number> = {};

      for (const row of rows) {
        counts[row.category_id] = row.total;
      }

      return counts;
    },
    save(transaction) {
      return source.save(toTransactionRow(transaction));
    },
    remove(id) {
      return source.remove(id);
    },
  };
}

function createCategoryRepository(client: DatabaseClient): CategoryRepository {
  const source = createCategorySource(client);

  return {
    async list() {
      return (await source.list()).map(toCategory);
    },
    async findById(id) {
      const row = await source.findById(id);
      return row ? toCategory(row) : null;
    },
    save(category) {
      return source.save(toCategoryRow(category));
    },
    remove(id) {
      return source.remove(id);
    },
  };
}

function createBudgetRepository(client: DatabaseClient): BudgetRepository {
  const source = createBudgetSource(client);

  return {
    async list() {
      return (await source.list()).map(toBudget);
    },
    async findById(id) {
      const row = await source.findById(id);
      return row ? toBudget(row) : null;
    },
    async listByPeriod(period) {
      const rows = await source.listByPeriod(
        formatYearMonth(period.year, period.month),
      );
      return rows.map(toBudget);
    },
    save(budget) {
      return source.save(toBudgetRow(budget));
    },
    remove(id) {
      return source.remove(id);
    },
  };
}

function createPreferencesRepository(
  client: DatabaseClient,
): PreferencesRepository {
  const source = createPreferencesSource(client);

  return {
    async get() {
      const row = await source.get();
      return row ? toPreferences(row) : null;
    },
    save(preferences) {
      return source.save(toPreferenceParams(preferences));
    },
  };
}

function createExchangeRateRepository(
  client: DatabaseClient,
): ExchangeRateRepository {
  const source = createRateSource(client);

  return {
    async list() {
      return (await source.list()).map(toExchangeRate);
    },
    async saveAll(rates) {
      await client.transaction(async () => {
        for (const rate of rates) {
          await source.save(toExchangeRateRow(rate));
        }
      });
    },
  };
}
