import type { DatabaseClient, SqlValue } from '@/database/client';
import type { PreferencesRow } from '@/database/mappers';

const columns =
  'id, currency, theme, notifications_enabled, onboarding_completed, display_name, reminder_day, reminder_hour';

export function createPreferencesSource(client: DatabaseClient) {
  return {
    get(): Promise<PreferencesRow | null> {
      return client.get<PreferencesRow>(
        `SELECT ${columns} FROM preferences WHERE id = 'local'`,
      );
    },
    save(params: SqlValue[]): Promise<void> {
      return client.run(
        `INSERT INTO preferences (
           id, currency, theme, notifications_enabled, onboarding_completed,
           display_name, reminder_day, reminder_hour
         ) VALUES ('local', ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           currency = excluded.currency,
           theme = excluded.theme,
           notifications_enabled = excluded.notifications_enabled,
           onboarding_completed = excluded.onboarding_completed,
           display_name = excluded.display_name,
           reminder_day = excluded.reminder_day,
           reminder_hour = excluded.reminder_hour`,
        params,
      );
    },
  };
}
