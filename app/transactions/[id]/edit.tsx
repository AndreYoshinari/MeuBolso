import { useLocalSearchParams } from 'expo-router';

import { EditTransactionScreen } from '@/features/transactions/edit-transaction-screen';

export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactionId = Array.isArray(id) ? (id[0] ?? '') : (id ?? '');

  return <EditTransactionScreen transactionId={transactionId} />;
}
