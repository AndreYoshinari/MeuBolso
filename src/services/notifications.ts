import type { Repositories } from '@/domain/repositories';
import { budgetAlerts } from '@/lib/budget-alerts';
import type { YearMonth } from '@/lib/period';

export type ScheduledAlert = {
  identifier: string;
  title: string;
  body: string;
};

export type NotificationPort = {
  ensurePermission: () => Promise<boolean>;
  schedule: (alert: ScheduledAlert) => Promise<void>;
};

type NotifyDeps = {
  repositories: Pick<
    Repositories,
    'budgets' | 'transactions' | 'categories'
  > & {
    preferences?: Pick<Repositories['preferences'], 'get'>;
  };
  period: YearMonth;
  notifications?: NotificationPort;
};

export async function notifyBudgetThresholds(
  deps: NotifyDeps,
): Promise<{ delivered: boolean }> {
  const [budgets, transactions, categories] = await Promise.all([
    deps.repositories.budgets.listByPeriod(deps.period),
    deps.repositories.transactions.listByPeriod(deps.period),
    deps.repositories.categories.list(),
  ]);
  const preferences = await deps.repositories.preferences?.get();

  if (preferences && !preferences.notificationsEnabled) {
    return { delivered: false };
  }

  const alerts = budgetAlerts(budgets, transactions, categories);

  if (alerts.length === 0) {
    return { delivered: false };
  }

  const port = deps.notifications ?? (await createExpoNotificationPort());
  const granted = await port.ensurePermission();

  if (!granted) {
    return { delivered: false };
  }

  for (const alert of alerts) {
    await port.schedule({
      identifier: `budget-${alert.categoryId}-${alert.year}-${alert.month}-${alert.level}`,
      title: 'Orçamento',
      body:
        alert.level === 'reached'
          ? `${alert.categoryName} atingiu o limite do orçamento.`
          : `${alert.categoryName} atingiu 80% do orçamento.`,
    });
  }

  return { delivered: true };
}

export async function notifyBudgetPeriodSafely(
  deps: NotifyDeps,
): Promise<void> {
  try {
    await notifyBudgetThresholds(deps);
  } catch (error) {
    console.error(
      'notifications',
      error instanceof Error ? error.name : 'unknown',
    );
  }
}

async function createExpoNotificationPort(): Promise<NotificationPort> {
  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  return {
    async ensurePermission() {
      const current = await Notifications.getPermissionsAsync();

      if (current.granted) {
        return true;
      }

      const requested = await Notifications.requestPermissionsAsync();

      return requested.granted;
    },
    async schedule(alert) {
      await Notifications.scheduleNotificationAsync({
        identifier: alert.identifier,
        content: { title: alert.title, body: alert.body },
        trigger: null,
      });
    },
  };
}
