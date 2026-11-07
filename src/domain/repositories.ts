import type { YearMonth } from '@/lib/period';

import type {
  Budget,
  Category,
  ExchangeRate,
  Transaction,
  UserPreferences,
} from '@/domain/types';

export interface TransactionRepository {
  list(): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  listByPeriod(period: YearMonth): Promise<Transaction[]>;
  countByCategory(): Promise<Record<string, number>>;
  save(transaction: Transaction): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  save(category: Category): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface BudgetRepository {
  list(): Promise<Budget[]>;
  findById(id: string): Promise<Budget | null>;
  listByPeriod(period: YearMonth): Promise<Budget[]>;
  save(budget: Budget): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface PreferencesRepository {
  get(): Promise<UserPreferences | null>;
  save(preferences: UserPreferences): Promise<void>;
}

export interface ExchangeRateRepository {
  list(): Promise<ExchangeRate[]>;
  saveAll(rates: readonly ExchangeRate[]): Promise<void>;
}

export type Repositories = {
  transactions: TransactionRepository;
  categories: CategoryRepository;
  budgets: BudgetRepository;
  preferences: PreferencesRepository;
  rates: ExchangeRateRepository;
};
