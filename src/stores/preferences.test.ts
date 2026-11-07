import { defaultUserPreferences } from '@/domain/preferences';
import { ValidationError } from '@/lib/errors';

import { savePreferences } from '@/services/preferences';
import {
  initialPreferencesData,
  usePreferencesStore,
} from '@/stores/preferences';

jest.mock('@/services/preferences', () => ({
  savePreferences: jest.fn(),
}));

const mockedSave = jest.mocked(savePreferences);

beforeEach(() => {
  usePreferencesStore.setState(initialPreferencesData);
  mockedSave.mockReset();
});

test('hydrates preferences without writing them again', () => {
  usePreferencesStore.getState().hydrate({
    ...defaultUserPreferences,
    theme: 'light',
    notificationsEnabled: true,
    onboardingCompleted: true,
  });

  expect(usePreferencesStore.getState()).toMatchObject({
    theme: 'light',
    notificationsEnabled: true,
    hydrated: true,
  });
  expect(mockedSave).not.toHaveBeenCalled();
});

test('keeps the previous theme when saving fails', async () => {
  mockedSave.mockRejectedValue(
    new ValidationError([{ field: 'theme', message: 'Tema inválido.' }]),
  );

  await expect(
    usePreferencesStore.getState().setTheme('light'),
  ).rejects.toBeInstanceOf(ValidationError);
  expect(usePreferencesStore.getState().theme).toBe('dark');
});

test('writes the theme through the preferences service', async () => {
  mockedSave.mockImplementation(async input => input as never);

  await usePreferencesStore.getState().setTheme('light');

  expect(mockedSave).toHaveBeenCalledWith(
    expect.objectContaining({ theme: 'light', currency: 'BRL' }),
  );
  expect(usePreferencesStore.getState().theme).toBe('light');
  expect(usePreferencesStore.getState().hydrated).toBe(true);
});

test('writes the display name through the preferences service', async () => {
  mockedSave.mockImplementation(async input => input as never);

  await usePreferencesStore.getState().setDisplayName('  Ana  ');

  expect(mockedSave).toHaveBeenCalledWith(
    expect.objectContaining({ displayName: '  Ana  ', currency: 'BRL' }),
  );
});
