import type { DatabaseClient } from '@/database/client';
import { defaultUserPreferences } from '@/domain/preferences';
import { DatabaseError } from '@/lib/errors';

export async function clearUserTables(client: DatabaseClient): Promise<void> {
  const defaults = defaultUserPreferences;

  try {
    await client.transaction(async () => {
      await client.run('DELETE FROM transactions');
      await client.run('DELETE FROM budgets');
      await client.run('DELETE FROM exchange_rates');
      await client.run('DELETE FROM categories WHERE is_system = 0');
      await client.run(
        `UPDATE preferences SET
           display_name = ?,
           currency = ?,
           theme = ?,
           notifications_enabled = ?,
           onboarding_completed = ?,
           reminder_day = ?,
           reminder_hour = ?
         WHERE id = 'local'`,
        [
          defaults.displayName,
          defaults.currency,
          defaults.theme,
          defaults.notificationsEnabled ? 1 : 0,
          defaults.onboardingCompleted ? 1 : 0,
          defaults.reminderDay,
          defaults.reminderHour,
        ],
      );
    });
  } catch (error) {
    throw new DatabaseError('Não foi possível limpar os dados locais.', {
      cause: error,
    });
  }
}
