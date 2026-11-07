import { getExpensesByCategory, getMonthlyFinancialHistory } from '@/domain';
import {
  useQuery,
  useQueryState,
  type QueryState,
} from '@/features/query-state';
import {
  buildReport,
  clampReportRange,
  monthsInRange,
  type FinancialReport,
  type ReportRange,
} from '@/features/reports/model';
import { queryKeys } from '@/lib/query-keys';
import { formatYearMonth, shiftYearMonth } from '@/lib/period';
import { getUseCaseDeps } from '@/services/database';

export type { FinancialReport, ReportRange };

export function useReport(range: ReportRange): QueryState<FinancialReport> {
  const clamped = clampReportRange(range);
  const query = useQuery({
    queryKey: queryKeys.charts(
      formatYearMonth(clamped.from.year, clamped.from.month),
      formatYearMonth(clamped.to.year, clamped.to.month),
    ),
    queryFn: () => loadReport(clamped),
  });

  return useQueryState(query);
}

async function loadReport(range: ReportRange): Promise<FinancialReport> {
  const deps = await getUseCaseDeps();
  const months = monthsInRange(range);
  const years = new Set(months.map(month => month.year));
  const first = months[0];

  if (months.length === 1 && first) {
    years.add(shiftYearMonth(first, -1).year);
  }

  const histories = await Promise.all(
    [...years].map(year => getMonthlyFinancialHistory(deps, year)),
  );
  const expensesByMonth = await Promise.all(
    months.map(month => getExpensesByCategory(deps, month)),
  );

  return buildReport(range, histories.flat(), expensesByMonth);
}
