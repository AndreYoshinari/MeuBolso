import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Alert } from 'react-native';

import { ErrorView, LoadingView, ScreenContainer } from '@/components';
import { BudgetForm } from '@/features/budgets/budget-form';
import { useCreateBudget } from '@/features/budgets/hooks';
import {
  toBudgetInput,
  type BudgetFormValues,
} from '@/features/budgets/schema';
import { useCategories } from '@/features/categories/hooks';
import { parseYearMonth, type YearMonth } from '@/lib/period';

type CreateBudgetScreenProps = {
  period: string;
};

export function CreateBudgetScreen({ period }: CreateBudgetScreenProps) {
  const router = useRouter();
  const categories = useCategories();
  const create = useCreateBudget();
  const saved = useRef(false);
  const initial = parseYearMonth(period) ?? currentPeriod();

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
    <BudgetForm
      categories={categories.data ?? []}
      defaultValues={{
        categoryId: '',
        amount: '',
        month: initial.month,
        year: initial.year,
      }}
      errorMessage={create.errorMessage}
      isPending={create.isPending}
      onSubmit={submit}
      title="Novo orçamento"
    />
  );

  async function submit(values: BudgetFormValues) {
    if (saved.current) {
      return;
    }

    saved.current = true;

    try {
      await create.execute(toBudgetInput(values));
    } catch {
      saved.current = false;
      return;
    }

    router.back();
    Alert.alert('Orçamento salvo', 'O gasto do mês será acompanhado aqui.');
  }
}

function currentPeriod(): YearMonth {
  const now = new Date();

  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
