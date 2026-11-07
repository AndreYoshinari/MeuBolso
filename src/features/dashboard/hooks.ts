import {
  getExpensesByCategory,
  getFinancialSummary,
  getRecentTransactions,
  getTotalBalance,
  type CategoryExpense,
  type FinancialSummary,
  type RecentTransaction,
} from '@/domain';
import {
  useQuery,
  useQueryState,
  type QueryState,
} from '@/features/query-state';
import { ValidationError } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';
import { parseYearMonth } from '@/lib/period';
import { getUseCaseDeps } from '@/services/database';

export type DashboardData = {
  totalBalanceCents: number;
  summary: FinancialSummary;
  expenses: CategoryExpense[];
  recent: RecentTransaction[];
};

export function useDashboard(yearMonth: string): QueryState<DashboardData> {
  const query = useQuery({
    queryKey: queryKeys.dashboard(yearMonth),
    queryFn: async () => {
      const deps = await getUseCaseDeps();
      const period = parseYearMonth(yearMonth);

      if (!period) {
        throw new ValidationError([
          { field: 'period', message: 'Informe um mês e um ano válidos.' },
        ]);
      }

      const [summary, expenses, recent, totalBalanceCents] = await Promise.all([
        getFinancialSummary(deps, period),
        getExpensesByCategory(deps, period),
        getRecentTransactions(deps, period),
        getTotalBalance(deps),
      ]);

      return { totalBalanceCents, summary, expenses, recent };
    },
  });

  return useQueryState(query);
}
