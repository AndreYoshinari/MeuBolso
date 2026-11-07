import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { clearAppUserData } from '@/database/app-database';
import type { ThemeMode } from '@/domain/types';
import { useAppMutation } from '@/features/query-state';
import { toUserMessage } from '@/lib/error-message';
import { loadPreferences } from '@/services/preferences';
import { syncFinancialReminder } from '@/services/reminders';
import { usePreferencesStore } from '@/stores/preferences';

export function usePreferences() {
  const displayName = usePreferencesStore(state => state.displayName);
  const currency = usePreferencesStore(state => state.currency);
  const theme = usePreferencesStore(state => state.theme);
  const notificationsEnabled = usePreferencesStore(
    state => state.notificationsEnabled,
  );
  const reminderDay = usePreferencesStore(state => state.reminderDay);
  const reminderHour = usePreferencesStore(state => state.reminderHour);
  const onboardingCompleted = usePreferencesStore(
    state => state.onboardingCompleted,
  );
  const hydrated = usePreferencesStore(state => state.hydrated);
  const setDisplayName = usePreferencesStore(state => state.setDisplayName);
  const setTheme = usePreferencesStore(state => state.setTheme);
  const setNotificationsEnabled = usePreferencesStore(
    state => state.setNotificationsEnabled,
  );
  const setReminder = usePreferencesStore(state => state.setReminder);
  const setOnboardingCompleted = usePreferencesStore(
    state => state.setOnboardingCompleted,
  );

  return {
    displayName,
    currency,
    theme,
    notificationsEnabled,
    reminderDay,
    reminderHour,
    onboardingCompleted,
    hydrated,
    setDisplayName,
    setTheme: (theme: ThemeMode) => setTheme(theme),
    setNotificationsEnabled,
    setReminder,
    setOnboardingCompleted,
  };
}

export function useSettings() {
  const preferences = usePreferences();
  const clear = useClearLocalData();
  const [notice, setNotice] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  async function saveDisplayName(displayName: string) {
    try {
      await preferences.setDisplayName(displayName);
      setNameError(null);
    } catch (error) {
      setNameError(toUserMessage(error));
    }
  }

  async function enableNotifications() {
    setNotice(null);

    try {
      const current = usePreferencesStore.getState();
      const result = await syncFinancialReminder(
        {
          notificationsEnabled: true,
          reminderDay: current.reminderDay,
          reminderHour: current.reminderHour,
        },
        'request',
      );

      if (result === 'denied') {
        setNotice('O sistema não permitiu as notificações.');
        return;
      }

      await preferences.setNotificationsEnabled(true);
    } catch (error) {
      setNotice(toUserMessage(error));
    }
  }

  async function disableNotifications() {
    setNotice(null);

    try {
      await preferences.setNotificationsEnabled(false);
      const current = usePreferencesStore.getState();
      await syncFinancialReminder(
        {
          notificationsEnabled: false,
          reminderDay: current.reminderDay,
          reminderHour: current.reminderHour,
        },
        'quiet',
      );
    } catch (error) {
      setNotice(toUserMessage(error));
    }
  }

  async function changeReminder(reminderDay: number, reminderHour: number) {
    try {
      await preferences.setReminder(reminderDay, reminderHour);

      if (!usePreferencesStore.getState().notificationsEnabled) {
        return;
      }

      const result = await syncFinancialReminder(
        {
          notificationsEnabled: true,
          reminderDay,
          reminderHour,
        },
        'request',
      );

      if (result === 'denied') {
        setNotice('O sistema não permitiu as notificações.');
        await preferences.setNotificationsEnabled(false);
      }
    } catch (error) {
      setNotice(toUserMessage(error));
    }
  }

  return {
    ...preferences,
    notice,
    nameError,
    saveDisplayName,
    enableNotifications,
    disableNotifications,
    changeReminder,
    clearLocalData: clear.execute,
    clearError: clear.errorMessage,
    clearing: clear.isPending,
  };
}

function useClearLocalData() {
  const queryClient = useQueryClient();

  return useAppMutation<void, void>({
    mutationFn: async () => {
      await clearAppUserData();
      const preferences = await loadPreferences();
      usePreferencesStore.getState().hydrate(preferences);
      await syncFinancialReminder(preferences, 'quiet');
      await queryClient.invalidateQueries();
    },
  });
}
