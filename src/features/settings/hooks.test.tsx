import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { defaultUserPreferences } from '@/domain/preferences';
import { usePreferences, useSettings } from '@/features/settings/hooks';
import { createAppQueryClient } from '@/providers/query-client';
import { savePreferences } from '@/services/preferences';
import { syncFinancialReminder } from '@/services/reminders';
import {
  initialPreferencesData,
  usePreferencesStore,
} from '@/stores/preferences';

jest.mock('@/services/preferences', () => ({
  savePreferences: jest.fn(),
  loadPreferences: jest.fn(),
}));

jest.mock('@/services/reminders', () => ({
  syncFinancialReminder: jest.fn(async () => 'scheduled'),
}));

jest.mock('@/database/app-database', () => ({
  clearAppUserData: jest.fn(),
}));

const mockedSave = jest.mocked(savePreferences);

beforeEach(() => {
  usePreferencesStore.setState(initialPreferencesData);
  mockedSave.mockReset();
});

test('reads the hydrated session from the store', async () => {
  usePreferencesStore.getState().hydrate({
    ...defaultUserPreferences,
    theme: 'light',
    notificationsEnabled: true,
  });
  const view = await renderHook(() => usePreferences());

  expect(view.result.current).toMatchObject({
    theme: 'light',
    notificationsEnabled: true,
    hydrated: true,
    currency: 'BRL',
    reminderDay: 1,
    reminderHour: 9,
  });
});

test('keeps notifications off when the system denies permission', async () => {
  jest.mocked(syncFinancialReminder).mockResolvedValueOnce('denied');
  const client = createAppQueryClient();
  const view = await renderHook(() => useSettings(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });

  await act(async () => {
    await view.result.current?.enableNotifications();
  });

  expect(view.result.current?.notificationsEnabled).toBe(false);
  expect(view.result.current?.notice).toBe(
    'O sistema não permitiu as notificações.',
  );
  client.clear();
});
