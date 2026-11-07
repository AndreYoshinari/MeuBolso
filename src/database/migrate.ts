import type { DatabaseClient } from '@/database/client';
import { MIGRATIONS } from '@/database/migrations';

const SCHEMA_MIGRATIONS = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
) STRICT
`;

export async function migrate(client: DatabaseClient): Promise<void> {
  await client.run(SCHEMA_MIGRATIONS);

  const applied = await client.all<{ version: number }>(
    'SELECT version FROM schema_migrations',
  );
  const versions = new Set(applied.map(row => row.version));

  for (const migration of MIGRATIONS) {
    if (versions.has(migration.version)) {
      continue;
    }

    // A versão entra na mesma transação. Se algo falhar, o rollback permite tentar de novo.
    await client.transaction(async () => {
      for (const statement of migration.statements) {
        await client.run(statement.sql, statement.params);
      }

      await client.run(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        [migration.version, new Date().toISOString()],
      );
    });
  }
}
