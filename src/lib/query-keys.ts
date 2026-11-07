import type { TransactionFilters } from '@/lib/transaction-filters';

export const queryKeys = {
  transactions: (filters: TransactionFilters) =>
    ['transactions', filters] as const,
  categoryTransactionCounts: ['transactions', 'category-counts'] as const,
  transaction: (id: string) => ['transaction', id] as const,
  categories: ['categories'] as const,
  dashboard: (yearMonth: string) => ['dashboard', yearMonth] as const,
  budgets: (yearMonth: string) => ['budgets', yearMonth] as const,
  charts: (from: string, to: string) => ['charts', from, to] as const,
  rates: ['rates'] as const,
  rateCurrencies: ['rates', 'currencies'] as const,
  rateQuote: (base: string, quote: string, date: string | null) =>
    ['rates', 'quote', base, quote, date ?? 'latest'] as const,
  storedRate: (base: string, quote: string, date: string | null) =>
    ['rates', 'stored', base, quote, date ?? 'latest'] as const,
};
