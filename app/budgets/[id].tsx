import { useLocalSearchParams } from 'expo-router';

import { EditBudgetScreen } from '@/features/budgets/edit-budget-screen';

export default function EditBudgetRoute() {
  const { id, period } = useLocalSearchParams<{
    id: string;
    period?: string;
  }>();
  const budgetId = Array.isArray(id) ? (id[0] ?? '') : (id ?? '');
  const yearMonth = Array.isArray(period) ? (period[0] ?? '') : (period ?? '');

  return <EditBudgetScreen budgetId={budgetId} period={yearMonth} />;
}
