import { useLocalSearchParams } from 'expo-router';

import { EditCategoryScreen } from '@/features/categories/edit-category-screen';

export default function EditCategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = Array.isArray(id) ? (id[0] ?? '') : (id ?? '');

  return <EditCategoryScreen categoryId={categoryId} />;
}
