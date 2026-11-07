import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Alert } from 'react-native';

import { ErrorView, LoadingView, ScreenContainer } from '@/components';
import { CategoryForm } from '@/features/categories/category-form';
import {
  useCategories,
  useCategoryTransactionCounts,
  useDeleteCategory,
  useUpdateCategory,
} from '@/features/categories/hooks';
import { categoryIconName } from '@/features/categories/options';
import { formatTransactionCount } from '@/features/categories/presentation';
import {
  toCategoryInput,
  type CategoryFormValues,
} from '@/features/categories/schema';

type EditCategoryScreenProps = {
  categoryId: string;
};

export function EditCategoryScreen({ categoryId }: EditCategoryScreenProps) {
  const router = useRouter();
  const categories = useCategories();
  const counts = useCategoryTransactionCounts();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const saved = useRef(false);
  const current = categories.data?.find(category => category.id === categoryId);

  if (categories.isLoading && !categories.data) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <LoadingView message="Carregando a categoria" />
      </ScreenContainer>
    );
  }

  if (!current) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <ErrorView
          message={categories.errorMessage ?? 'Categoria não encontrada.'}
          onRetry={() => {
            void categories.refetch();
          }}
        />
      </ScreenContainer>
    );
  }

  const usage = counts.data
    ? formatTransactionCount(counts.data[current.id] ?? 0)
    : null;
  const icon = categoryIconName(current.icon);

  return (
    <CategoryForm
      defaultValues={{
        name: current.name,
        type: current.type,
        icon,
        color: current.color,
      }}
      deletePending={remove.isPending}
      errorMessage={update.errorMessage ?? remove.errorMessage}
      isPending={update.isPending}
      notice={notice(current.isDefault, usage)}
      onDelete={current.isDefault ? undefined : confirmDelete}
      onSubmit={submit}
      submitLabel="Salvar"
      title="Editar categoria"
    />
  );

  async function submit(values: CategoryFormValues) {
    if (saved.current) {
      return;
    }

    saved.current = true;

    try {
      await update.execute({
        id: categoryId,
        input: toCategoryInput(values),
      });
    } catch {
      saved.current = false;
      return;
    }

    router.back();
    Alert.alert('Categoria atualizada', 'Os lançamentos usam este nome.');
  }

  function confirmDelete() {
    Alert.alert('Excluir categoria', 'Esta ação não pode ser desfeita.', [
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
      await remove.execute(categoryId);
    } catch {
      return;
    }

    router.back();
  }
}

function notice(isDefault: boolean, usage: string | null): string {
  const parts: string[] = [];

  if (isDefault) {
    parts.push('Categoria padrão não pode ser excluída.');
  }

  if (usage) {
    parts.push(usage);
  }

  return parts.join(' ');
}
