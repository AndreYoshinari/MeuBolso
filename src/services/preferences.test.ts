import { ValidationError } from '@/lib/errors';

import { defaultUserPreferences } from '@/domain/preferences';
import { createMemoryRepositories } from '@/domain/testing/memory-repositories';
import { loadPreferences, savePreferences } from '@/services/preferences';
import { createTestDeps } from '@/domain/testing/test-deps';

const preferences = { ...defaultUserPreferences };

test('loads and saves preferences through the repository', async () => {
  const deps = createTestDeps();
  await deps.preferences.save(preferences);

  await expect(loadPreferences(deps)).resolves.toEqual(preferences);

  const saved = await savePreferences({ ...preferences, theme: 'light' }, deps);

  expect(saved.theme).toBe('light');
  expect(await deps.preferences.get()).toEqual({
    ...preferences,
    theme: 'light',
  });
  await expect(
    savePreferences({ ...preferences, currency: 'USD' }, deps),
  ).rejects.toBeInstanceOf(ValidationError);
});

test('does not invent preferences when the repository is empty', async () => {
  const deps = {
    ...createMemoryRepositories(),
    ids: () => 'id',
    now: () => '2026-03-01T00:00:00.000Z',
  };

  await expect(loadPreferences(deps)).rejects.toThrow(
    'ainda não foram criadas',
  );
});
