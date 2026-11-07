import { useRouter } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppText,
  CurrencyText,
  ErrorView,
  LoadingView,
  ScreenContainer,
} from '@/components';
import { useCategories } from '@/features/categories/hooks';
import {
  useDeleteTransaction,
  useTransaction,
} from '@/features/transactions/hooks';
import { editTransactionHref } from '@/features/navigation/routes';
import { claimSubmit, releaseSubmit } from '@/lib/submit-guard';
import { formatCivilDate } from '@/lib/period';
import { useTheme, type Theme } from '@/theme';

type TransactionDetailScreenProps = {
  transactionId: string;
};

export function TransactionDetailScreen({
  transactionId,
}: TransactionDetailScreenProps) {
  const router = useRouter();
  const removed = useRef(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const transaction = useTransaction(transactionId);
  const categories = useCategories();
  const remove = useDeleteTransaction();
  const current = transaction.data;
  const categoryName =
    categories.data?.find(category => category.id === current?.categoryId)
      ?.name ?? 'Categoria';

  if (transaction.isLoading) {
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

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll>
      <AppHeader showBack title="Lançamento" />
      <View style={styles.summary}>
        <AppText variant="title">{current.description}</AppText>
        <CurrencyText
          amountCents={current.amountCents}
          kind={current.type}
          variant="title"
        />
        <AppText color="muted">
          {`${current.type === 'income' ? 'Receita' : 'Despesa'} · ${categoryName}`}
        </AppText>
        <AppText color="muted">{formatCivilDate(current.date)}</AppText>
      </View>
      <View style={styles.notes}>
        <AppText variant="label">Observações</AppText>
        <AppText color={current.notes.trim() === '' ? 'muted' : 'default'}>
          {current.notes.trim() === '' ? 'Sem observações' : current.notes}
        </AppText>
      </View>
      {remove.errorMessage ? (
        <AppText color="expense">{remove.errorMessage}</AppText>
      ) : null}
      <AppButton
        label="Editar"
        onPress={() => router.push(editTransactionHref(current.id))}
        variant="secondary"
      />
      <AppButton
        disabled={remove.isPending}
        label="Excluir"
        loading={remove.isPending}
        onPress={confirmDelete}
        variant="danger"
      />
    </ScreenContainer>
  );

  function confirmDelete() {
    Alert.alert('Excluir lançamento', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          void deleteCurrent();
        },
      },
    ]);
  }

  async function deleteCurrent() {
    if (!claimSubmit(removed)) {
      return;
    }

    try {
      await remove.execute(transactionId);
    } catch {
      releaseSubmit(removed);
      return;
    }

    router.back();
  }
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    summary: {
      gap: theme.spacing.sm,
    },
    notes: {
      gap: theme.spacing.sm,
    },
  });
}
