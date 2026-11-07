import { useLocalSearchParams } from 'expo-router';

import { CreateBudgetScreen } from '@/features/budgets/create-budget-screen';

export default function NewBudgetRoute() {
  const { period } = useLocalSearchParams<{ period?: string }>();
  const value = Array.isArray(period) ? period[0] : period;

  return <CreateBudgetScreen period={value ?? ''} />;
}
