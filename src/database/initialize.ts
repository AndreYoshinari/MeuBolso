import type { DatabaseClient } from '@/database/client';
import { migrate } from '@/database/migrate';
import { createSqliteRepositories } from '@/database/repositories';
import type { Repositories } from '@/domain/repositories';

export async function initializeDatabase(
  client: DatabaseClient,
): Promise<Repositories> {
  await client.run('PRAGMA foreign_keys = ON');
  await migrate(client);

  return createSqliteRepositories(client);
}
