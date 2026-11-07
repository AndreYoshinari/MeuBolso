import { periodFromCivilDate } from '@/lib/period';

import type { Repositories } from '@/domain/repositories';
import type {
  Budget,
  Category,
  ExchangeRate,
  Transaction,
  UserPreferences,
} from '@/domain/types';

export function createMemoryRepositories(): Repositories {
  const transactions: Transaction[] = [];
  const categories: Category[] = [];
  const budgets: Budget[] = [];
  const rates: ExchangeRate[] = [];
  let preferences: UserPreferences | null = null;

  return {
    transactions: {
      async list() {
        return transactions.map(copy);
      },
      async findById(id) {
        return copyOrNull(transactions.find(item => item.id === id));
      },
      async listByPeriod(period) {
        return transactions
          .filter(item => {
            const itemPeriod = periodFromCivilDate(item.date);

            return (
              itemPeriod?.year === period.year &&
              itemPeriod.month === period.month
            );
          })
          .map(copy);
      },
      async countByCategory() {
        const counts: Record<string, number> = {};

        for (const transaction of transactions) {
          counts[transaction.categoryId] =
            (counts[transaction.categoryId] ?? 0) + 1;
        }

        return counts;
      },
      async save(transaction) {
        upsert(transactions, copy(transaction));
      },
      async remove(id) {
        removeById(transactions, id);
      },
    },
    categories: {
      async list() {
        return categories.map(copy);
      },
      async findById(id) {
        return copyOrNull(categories.find(item => item.id === id));
      },
      async save(category) {
        upsert(categories, copy(category));
      },
      async remove(id) {
        removeById(categories, id);
      },
    },
    budgets: {
      async list() {
        return budgets.map(copy);
      },
      async findById(id) {
        return copyOrNull(budgets.find(item => item.id === id));
      },
      async listByPeriod(period) {
        return budgets
          .filter(
            item => item.year === period.year && item.month === period.month,
          )
          .map(copy);
      },
      async save(budget) {
        upsert(budgets, copy(budget));
      },
      async remove(id) {
        removeById(budgets, id);
      },
    },
    preferences: {
      async get() {
        return preferences ? copy(preferences) : null;
      },
      async save(value) {
        preferences = copy(value);
      },
    },
    rates: {
      async list() {
        return rates.map(copy);
      },
      async saveAll(next) {
        for (const rate of next) {
          const index = rates.findIndex(
            item => item.base === rate.base && item.quote === rate.quote,
          );
          const value = copy(rate);

          if (index === -1) {
            rates.push(value);
          } else {
            rates[index] = value;
          }
        }
      },
    },
  };
}

function copy<T>(value: T): T {
  return { ...value };
}

function copyOrNull<T>(value: T | undefined): T | null {
  return value ? copy(value) : null;
}

function upsert<T extends { id: string }>(items: T[], value: T) {
  const index = items.findIndex(item => item.id === value.id);

  if (index === -1) {
    items.push(value);
    return;
  }

  items[index] = value;
}

function removeById<T extends { id: string }>(items: T[], id: string) {
  const index = items.findIndex(item => item.id === id);

  if (index >= 0) {
    items.splice(index, 1);
  }
}
