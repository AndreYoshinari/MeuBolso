import { useLocalSearchParams } from 'expo-router';

import { CreateTransactionScreen } from '@/features/transactions/create-transaction-screen';
import type { AmountKind } from '@/lib/money';

export default function NewTransactionRoute() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const value = Array.isArray(type) ? type[0] : type;
  const initialKind: AmountKind = value === 'income' ? 'income' : 'expense';

  return (
    <CreateTransactionScreen initialKind={initialKind} key={initialKind} />
  );
}
