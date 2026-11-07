import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Alert } from 'react-native';

import { ErrorView, LoadingView, ScreenContainer } from '@/components';
import { BudgetForm } from '@/features/budgets/budget-form';
import {
  useBudgets,
  useDeleteBudget,
  useUpdateBudget,
} from '@/features/budgets/hooks';
import {
  toBudgetInput,
  type BudgetFormValues,
} from '@/features/budgets/schema';
import { useCategories } from '@/features/categories/hooks';
import { formatAmountInput } from '@/lib/amount-input';

type EditBudgetScreenProps = {
  budgetId: string;
  period: string;
};

export function EditBudgetScreen({ budgetId, period }: EditBudgetScreenProps) {
  const router = useRouter();
  const budgets = useBudgets(period);
  const categories = useCategories();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();
  const saved = useRef(false);
  const current = budgets.data?.find(budget => budget.id === budgetId);

  if (
    (budgets.isLoading && !budgets.data) ||
    (categories.isLoading && !categories.data)
  ) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <LoadingView message="Carregando o orçamento" />
      </ScreenContainer>
    );
  }

  if (!current) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <ErrorView
          message={budgets.errorMessage ?? 'Orçamento não encontrado.'}
          onRetry={() => {
            void budgets.refetch();
          }}
        />
      </ScreenContainer>
    );
  }

  return (
    <BudgetForm
      categories={categories.data ?? []}
      defaultValues={{
        categoryId: current.categoryId,
        amount: formatAmountInput(current.limitCents),
        month: current.month,
        year: current.year,
      }}
      deletePending={remove.isPending}
      errorMessage={update.errorMessage ?? remove.errorMessage}
      isPending={update.isPending}
      onDelete={confirmDelete}
      onSubmit={submit}
      title="Editar orçamento"
    />
  );

  async function submit(values: BudgetFormValues) {
    if (saved.current) {
      return;
    }

    saved.current = true;

    try {
      await update.execute({
        id: budgetId,
        input: toBudgetInput(values),
      });
    } catch {
      saved.current = false;
      return;
    }

    router.back();
    Alert.alert('Orçamento atualizado', 'O acompanhamento usa o novo limite.');
  }

  function confirmDelete() {
    Alert.alert('Excluir orçamento', 'Esta ação não pode ser desfeita.', [
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
    try {
      await remove.execute(budgetId);
    } catch {
      return;
    }

    router.back();
  }
}
