import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Alert } from 'react-native';

import { ErrorView, LoadingView, ScreenContainer } from '@/components';
import { useCategories } from '@/features/categories/hooks';
import { useCreateTransaction } from '@/features/transactions/hooks';
import {
  toTransactionInput,
  type TransactionFormValues,
} from '@/features/transactions/schema';
import { TransactionForm } from '@/features/transactions/transaction-form';
import type { AmountKind } from '@/lib/money';
import { civilMonthRange, formatYearMonth } from '@/lib/period';

type CreateTransactionScreenProps = {
  initialKind: AmountKind;
  today?: Date;
};

export function CreateTransactionScreen({
  initialKind,
  today = new Date(),
}: CreateTransactionScreenProps) {
  const router = useRouter();
  const categories = useCategories();
  const create = useCreateTransaction();
  const saved = useRef(false);

  if (categories.isLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <LoadingView message="Carregando categorias" />
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
      defaultValues={emptyTransaction(initialKind, today)}
      errorMessage={create.errorMessage}
      isPending={create.isPending}
      onSubmit={submit}
      submitLabel="Salvar"
      title="Nova transação"
    />
  );

  async function submit(values: TransactionFormValues) {
    if (saved.current) {
      return;
    }

    saved.current = true;

    try {
      await create.execute(toTransactionInput(values));
    } catch {
      saved.current = false;
      return;
    }

    router.back();
    Alert.alert('Lançamento salvo', 'O início será atualizado.');
  }
}

function emptyTransaction(
  type: AmountKind,
  today: Date,
): TransactionFormValues {
  const month = civilMonthRange(today);
  const day = String(today.getDate()).padStart(2, '0');

  return {
    description: '',
    amount: '',
    type,
    categoryId: '',
    date: `${formatYearMonth(month.year, month.month)}-${day}`,
    notes: '',
  };
}
