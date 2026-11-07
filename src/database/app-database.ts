import { openDatabaseAsync } from 'expo-sqlite';

import { clearUserTables } from '@/database/clear-user-data';
import type { DatabaseClient } from '@/database/client';
import { createExpoClient } from '@/database/expo-client';
import { initializeDatabase } from '@/database/initialize';
import type { Repositories } from '@/domain/repositories';
import { DatabaseError } from '@/lib/errors';

const DATABASE_NAME = 'meubolso.db';

let ready: Repositories | null = null;
let opening: Promise<Repositories> | null = null;
let databaseClient: DatabaseClient | null = null;

export function initializeAppDatabase(): Promise<Repositories> {
  if (ready) {
    return Promise.resolve(ready);
  }

  if (!opening) {
    opening = openDatabaseAsync(DATABASE_NAME)
      .then(database => {
        const client = createExpoClient(database);
        databaseClient = client;

        return initializeDatabase(client);
      })
      .then(repositories => {
        ready = repositories;
        return repositories;
      })
      .catch(error => {
        opening = null;
        throw error;
      });
  }

  return opening;
}

export async function clearAppUserData(): Promise<void> {
  if (!databaseClient) {
    throw new DatabaseError('O banco ainda não foi iniciado.');
  }

  await clearUserTables(databaseClient);
}

export function getRepositories(): Repositories {
  if (!ready) {
    throw new DatabaseError('O banco ainda não foi iniciado.');
  }

  return ready;
}
