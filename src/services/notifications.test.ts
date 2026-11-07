import { defaultUserPreferences } from '@/domain/preferences';
import type { Category } from '@/domain/types';
import { createMemoryRepositories } from '@/domain/testing/memory-repositories';
import {
  notifyBudgetPeriodSafely,
  notifyBudgetThresholds,
  type ScheduledAlert,
} from '@/services/notifications';

const food: Category = {
  id: 'food',
  name: 'Alimentação',
  icon: 'expense',
  color: '#FF6B7A',
  type: 'expense',
  isDefault: true,
};

async function seed() {
  const repositories = createMemoryRepositories();
  await repositories.categories.save(food);
  await repositories.budgets.save({
    id: 'budget-1',
    categoryId: 'food',
    amountCents: 10000,
    month: 3,
    year: 2026,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  });
  await repositories.transactions.save({
    id: 'tx-1',
    description: 'Mercado',
    amountCents: 8000,
    type: 'expense',
    categoryId: 'food',
    date: '2026-03-10',
    notes: '',
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
  });

  return repositories;
}

test('schedules a local alert and ignores a denied permission', async () => {
  const repositories = await seed();
  const scheduled: ScheduledAlert[] = [];
  const period = { year: 2026, month: 3 };

  await expect(
    notifyBudgetThresholds({
      repositories,
      period,
      notifications: {
        ensurePermission: async () => true,
        schedule: async alert => {
          scheduled.push(alert);
        },
      },
    }),
  ).resolves.toEqual({ delivered: true });
  expect(scheduled[0]?.body).toBe('Alimentação atingiu 80% do orçamento.');

  const schedule = jest.fn();

  await expect(
    notifyBudgetThresholds({
      repositories,
      period,
      notifications: {
        ensurePermission: async () => false,
        schedule,
      },
    }),
  ).resolves.toEqual({ delivered: false });
  expect(schedule).not.toHaveBeenCalled();
});

test('skips budget alerts when notifications are disabled', async () => {
  const repositories = await seed();
  await repositories.preferences.save({
    ...defaultUserPreferences,
    notificationsEnabled: false,
  });
  const schedule = jest.fn();

  await expect(
    notifyBudgetThresholds({
      repositories,
      period: { year: 2026, month: 3 },
      notifications: {
        ensurePermission: async () => true,
        schedule,
      },
    }),
  ).resolves.toEqual({ delivered: false });
  expect(schedule).not.toHaveBeenCalled();
});

test('does not throw when scheduling fails', async () => {
  const repositories = await seed();

  await expect(
    notifyBudgetPeriodSafely({
      repositories,
      period: { year: 2026, month: 3 },
      notifications: {
        ensurePermission: async () => true,
        schedule: async () => {
          throw new Error('native');
        },
      },
    }),
  ).resolves.toBeUndefined();
});
