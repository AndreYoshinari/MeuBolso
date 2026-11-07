import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Alert } from 'react-native';

import { ErrorView, LoadingView, ScreenContainer } from '@/components';
import { useCategories } from '@/features/categories/hooks';
import {
  useTransaction,
  useUpdateTransaction,
} from '@/features/transactions/hooks';
import {
  toTransactionInput,
  type TransactionFormValues,
} from '@/features/transactions/schema';
import { TransactionForm } from '@/features/transactions/transaction-form';
import { formatAmountInput } from '@/lib/amount-input';

type EditTransactionScreenProps = {
  transactionId: string;
};

export function EditTransactionScreen({
  transactionId,
}: EditTransactionScreenProps) {
  const router = useRouter();
  const transaction = useTransaction(transactionId);
  const categories = useCategories();
  const update = useUpdateTransaction();
  const saved = useRef(false);
  const current = transaction.data;

  if (transaction.isLoading || categories.isLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <LoadingView message="Carregando o lançamento" />
      </ScreenContainer>
    );
  }

  if (transaction.errorMessage || !current) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <ErrorView
          message={transaction.errorMessage ?? 'Lançamento não encontrado.'}
          onRetry={() => {
            void transaction.refetch();
          }}
        />
      </ScreenContainer>
    );
  }

  if (categories.errorMessage) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <ErrorView
          message={categories.errorMessage}
          onRetry={() => {
            void categories.refetch();
          }}
        />
      </ScreenContainer>
    );
  }

  return (
    <TransactionForm
      categories={categories.data ?? []}
      defaultValues={{
        description: current.description,
        amount: formatAmountInput(current.amountCents),
        type: current.type,
        categoryId: current.categoryId,
        date: current.date,
        notes: current.notes,
      }}
      errorMessage={update.errorMessage}
      isPending={update.isPending}
      onSubmit={submit}
      submitLabel="Salvar"
      title="Editar transação"
    />
  );

  async function submit(values: TransactionFormValues) {
    if (saved.current) {
      return;
    }

    saved.current = true;

    try {
      await update.execute({
        id: transactionId,
        input: toTransactionInput(values),
      });
    } catch {
      saved.current = false;
      return;
    }

    router.back();
    Alert.alert('Lançamento atualizado', 'O início será atualizado.');
  }
}
