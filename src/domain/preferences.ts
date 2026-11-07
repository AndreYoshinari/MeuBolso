import type { UserPreferences } from '@/domain/types';

export const defaultUserPreferences: UserPreferences = {
  displayName: '',
  currency: 'BRL',
  theme: 'dark',
  notificationsEnabled: false,
  reminderDay: 1,
  reminderHour: 9,
  onboardingCompleted: false,
};
