import type { AmountKind } from '@/lib/money';

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: AmountKind;
  isDefault: boolean;
};

export type Transaction = {
  id: string;
  description: string;
  amountCents: number;
  type: AmountKind;
  categoryId: string;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Budget = {
  id: string;
  categoryId: string;
  amountCents: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
};

export type ThemeMode = 'dark' | 'light';

export type UserPreferences = {
  displayName: string;
  currency: 'BRL';
  theme: ThemeMode;
  notificationsEnabled: boolean;
  reminderDay: number;
  reminderHour: number;
  onboardingCompleted: boolean;
};

export type ExchangeRate = {
  base: string;
  quote: string;
  rate: string;
  quotedOn: string;
  fetchedAt: string;
};
