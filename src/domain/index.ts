export {
  calculateBalance,
  calculateBudgetUtilization,
  calculateSpendingBasisPoints,
  countTransactionsByCategory,
  groupTransactionsByCategory,
  groupTransactionsByPeriod,
  sumExpenses,
  sumIncome,
  type BudgetUtilization,
  type TransactionGroup,
} from '@/domain/calculations';
export type {
  BudgetRepository,
  CategoryRepository,
  ExchangeRateRepository,
  PreferencesRepository,
  Repositories,
  TransactionRepository,
} from '@/domain/repositories';
export { defaultUserPreferences } from '@/domain/preferences';
export { failure, success, type ValidationResult } from '@/domain/result';
export {
  validateBudget,
  validateCategory,
  validateTransaction,
  validateUserPreferences,
} from '@/domain/rules';
export type {
  Budget,
  Category,
  ExchangeRate,
  ThemeMode,
  Transaction,
  UserPreferences,
} from '@/domain/types';
export {
  createBudget,
  deleteBudget,
  getBudgetsByPeriod,
  updateBudget,
} from '@/domain/usecases/budgets';
export {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '@/domain/usecases/categories';
export {
  getExpensesByCategory,
  getFinancialSummary,
  getMonthlyFinancialHistory,
  getRecentTransactions,
  getTotalBalance,
  type CategoryExpense,
  type FinancialSummary,
  type MonthlySnapshot,
  type RecentTransaction,
} from '@/domain/usecases/dashboard';
export {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  getTransactions,
  getTransactionsByPeriod,
  updateTransaction,
} from '@/domain/usecases/transactions';
