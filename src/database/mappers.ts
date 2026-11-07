import type { SqlValue } from '@/database/client';
import type {
  Budget,
  Category,
  ExchangeRate,
  Transaction,
  UserPreferences,
} from '@/domain/types';
import { DatabaseError } from '@/lib/errors';
import type { AmountKind } from '@/lib/money';
import { formatYearMonth, isCivilDate, parseYearMonth } from '@/lib/period';

export type CategoryRow = {
  id: string;
  name: string;
  kind: string;
  color: string;
  icon: string;
  is_system: number;
};

export type TransactionRow = {
  id: string;
  description: string;
  kind: string;
  amount_cents: number;
  category_id: string;
  occurred_on: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type BudgetRow = {
  id: string;
  category_id: string;
  limit_cents: number;
  year_month: string;
  created_at: string;
  updated_at: string;
};

export type PreferencesRow = {
  id: string;
  currency: string;
  theme: string;
  notifications_enabled: number;
  onboarding_completed: number;
  display_name: string;
  reminder_day: number;
  reminder_hour: number;
};

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: readKind(row.kind),
    isDefault: row.is_system === 1,
  };
}

export function toCategoryRow(category: Category): CategoryRow {
  return {
    id: category.id,
    name: category.name,
    kind: category.type,
    color: category.color,
    icon: category.icon,
    is_system: category.isDefault ? 1 : 0,
  };
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    description: row.description,
    amountCents: row.amount_cents,
    type: readKind(row.kind),
    categoryId: row.category_id,
    date: row.occurred_on,
    notes: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTransactionRow(transaction: Transaction): TransactionRow {
  return {
    id: transaction.id,
    description: transaction.description,
    kind: transaction.type,
    amount_cents: transaction.amountCents,
    category_id: transaction.categoryId,
    occurred_on: transaction.date,
    note: transaction.notes,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt,
  };
}

export function toBudget(row: BudgetRow): Budget {
  const period = readYearMonth(row.year_month);

  return {
    id: row.id,
    categoryId: row.category_id,
    amountCents: row.limit_cents,
    month: period.month,
    year: period.year,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toBudgetRow(budget: Budget): BudgetRow {
  return {
    id: budget.id,
    category_id: budget.categoryId,
    limit_cents: budget.amountCents,
    year_month: formatYearMonth(budget.year, budget.month),
    created_at: budget.createdAt,
    updated_at: budget.updatedAt,
  };
}

export function toPreferences(row: PreferencesRow): UserPreferences {
  if (row.currency !== 'BRL') {
    throw new DatabaseError('Moeda armazenada inválida.');
  }

  if (row.theme !== 'dark' && row.theme !== 'light') {
    throw new DatabaseError('Tema armazenado inválido.');
  }

  if (typeof row.display_name !== 'string' || row.display_name.length > 40) {
    throw new DatabaseError('Nome armazenado inválido.');
  }

  if (
    !Number.isInteger(row.reminder_day) ||
    row.reminder_day < 1 ||
    row.reminder_day > 28 ||
    !Number.isInteger(row.reminder_hour) ||
    row.reminder_hour < 0 ||
    row.reminder_hour > 23
  ) {
    throw new DatabaseError('Lembrete armazenado inválido.');
  }

  return {
    displayName: row.display_name.trim(),
    currency: 'BRL',
    theme: row.theme,
    notificationsEnabled: row.notifications_enabled === 1,
    reminderDay: row.reminder_day,
    reminderHour: row.reminder_hour,
    onboardingCompleted: row.onboarding_completed === 1,
  };
}

export function toPreferenceParams(preferences: UserPreferences): SqlValue[] {
  return [
    preferences.currency,
    preferences.theme,
    preferences.notificationsEnabled ? 1 : 0,
    preferences.onboardingCompleted ? 1 : 0,
    preferences.displayName,
    preferences.reminderDay,
    preferences.reminderHour,
  ];
}

function readYearMonth(value: string): { year: number; month: number } {
  const period = parseYearMonth(value);

  if (!period) {
    throw new DatabaseError('Período do orçamento inválido.');
  }

  return period;
}

function readKind(value: string): AmountKind {
  if (value !== 'income' && value !== 'expense') {
    throw new DatabaseError('Tipo armazenado inválido.');
  }

  return value;
}

export type ExchangeRateRow = {
  base: string;
  quote: string;
  rate: string;
  quoted_on: string;
  fetched_at: string;
};

export function toExchangeRate(row: ExchangeRateRow): ExchangeRate {
  if (!isCivilDate(row.quoted_on)) {
    throw new DatabaseError('Data da cotação inválida.');
  }

  return {
    base: row.base,
    quote: row.quote,
    rate: row.rate,
    quotedOn: row.quoted_on,
    fetchedAt: row.fetched_at,
  };
}

export function toExchangeRateRow(rate: ExchangeRate): ExchangeRateRow {
  return {
    base: rate.base,
    quote: rate.quote,
    rate: rate.rate,
    quoted_on: rate.quotedOn,
    fetched_at: rate.fetchedAt,
  };
}
