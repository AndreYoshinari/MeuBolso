import { initializeAppDatabase } from '@/database/app-database';
import type { Repositories } from '@/domain/repositories';

export type UseCaseDeps = Repositories & {
  ids: () => string;
  now: () => string;
};

export async function getUseCaseDeps(): Promise<UseCaseDeps> {
  const repositories = await initializeAppDatabase();

  return {
    ...repositories,
    ids: createId,
    now: timestampNow,
  };
}

function createId(): string {
  return globalThis.crypto.randomUUID();
}

function timestampNow(): string {
  return new Date().toISOString();
}
