import { unwrap } from '@/domain/usecases/guard';
import { validateUserPreferences } from '@/domain/rules';
import type { UserPreferences } from '@/domain/types';
import { DatabaseError } from '@/lib/errors';
import type { UseCaseDeps } from '@/services/database';

export async function loadPreferences(
  deps?: UseCaseDeps,
): Promise<UserPreferences> {
  const resolved = deps ?? (await defaultDeps());
  const preferences = await resolved.preferences.get();

  if (!preferences) {
    throw new DatabaseError('As preferências ainda não foram criadas.');
  }

  return preferences;
}

export async function savePreferences(
  input: unknown,
  deps?: UseCaseDeps,
): Promise<UserPreferences> {
  const resolved = deps ?? (await defaultDeps());
  const preferences = unwrap(validateUserPreferences(input));

  await resolved.preferences.save(preferences);

  return preferences;
}

async function defaultDeps(): Promise<UseCaseDeps> {
  const { getUseCaseDeps } = await import('@/services/database');

  return getUseCaseDeps();
}
