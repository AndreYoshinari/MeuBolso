import { defaultUserPreferences } from '@/domain/preferences';
import { createMemoryRepositories } from '@/domain/testing/memory-repositories';

test('stores preferences without a database', async () => {
  const repositories = createMemoryRepositories();

  expect(await repositories.preferences.get()).toBeNull();

  await repositories.preferences.save({
    ...defaultUserPreferences,
    notificationsEnabled: true,
  });

  expect(await repositories.preferences.get()).toEqual({
    ...defaultUserPreferences,
    notificationsEnabled: true,
  });
});
