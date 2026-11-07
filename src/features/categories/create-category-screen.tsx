import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Alert } from 'react-native';

import { CategoryForm } from '@/features/categories/category-form';
import { useCreateCategory } from '@/features/categories/hooks';
import { defaultCategoryValues } from '@/features/categories/options';
import {
  toCategoryInput,
  type CategoryFormValues,
} from '@/features/categories/schema';

export function CreateCategoryScreen() {
  const router = useRouter();
  const create = useCreateCategory();
  const saved = useRef(false);

  return (
    <CategoryForm
      defaultValues={defaultCategoryValues()}
      errorMessage={create.errorMessage}
      isPending={create.isPending}
      onSubmit={submit}
      submitLabel="Salvar"
      title="Nova categoria"
    />
  );

  async function submit(values: CategoryFormValues) {
    if (saved.current) {
      return;
    }

    saved.current = true;

    try {
      await create.execute(toCategoryInput(values));
    } catch {
      saved.current = false;
      return;
    }

    router.back();
    Alert.alert('Categoria salva', 'Ela já pode ser usada nos lançamentos.');
  }
}
