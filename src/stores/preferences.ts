import { create } from 'zustand';

import { defaultUserPreferences } from '@/domain/preferences';
import type { ThemeMode, UserPreferences } from '@/domain/types';
import { savePreferences } from '@/services/preferences';

type PreferencesData = UserPreferences & {
  hydrated: boolean;
};

type PreferencesState = PreferencesData & {
  hydrate: (preferences: UserPreferences) => void;
  setDisplayName: (displayName: string) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setReminder: (reminderDay: number, reminderHour: number) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
};

export const initialPreferencesData: PreferencesData = {
  ...defaultUserPreferences,
  hydrated: false,
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...initialPreferencesData,
  hydrate(preferences) {
    set({ ...preferences, hydrated: true });
  },
  async setDisplayName(displayName) {
    await persist(set, { ...snapshot(get()), displayName });
  },
  async setTheme(theme) {
    await persist(set, { ...snapshot(get()), theme });
  },
  async setNotificationsEnabled(notificationsEnabled) {
    await persist(set, { ...snapshot(get()), notificationsEnabled });
  },
  async setReminder(reminderDay, reminderHour) {
    await persist(set, { ...snapshot(get()), reminderDay, reminderHour });
  },
  async setOnboardingCompleted(onboardingCompleted) {
    await persist(set, { ...snapshot(get()), onboardingCompleted });
  },
}));

async function persist(
  set: (partial: Partial<PreferencesState> | PreferencesState) => void,
  next: UserPreferences,
) {
  const saved = await savePreferences(next);
  set({ ...saved, hydrated: true });
}

function snapshot(state: PreferencesState): UserPreferences {
  return {
    displayName: state.displayName,
    currency: state.currency,
    theme: state.theme,
    notificationsEnabled: state.notificationsEnabled,
    reminderDay: state.reminderDay,
    reminderHour: state.reminderHour,
    onboardingCompleted: state.onboardingCompleted,
  };
}
