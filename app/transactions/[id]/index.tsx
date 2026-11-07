import { useLocalSearchParams } from 'expo-router';

import { TransactionDetailScreen } from '@/features/transactions/transaction-detail-screen';

export default function TransactionDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactionId = Array.isArray(id) ? (id[0] ?? '') : (id ?? '');

  return <TransactionDetailScreen transactionId={transactionId} />;
}
