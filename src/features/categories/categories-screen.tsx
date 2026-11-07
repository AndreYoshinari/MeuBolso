import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppIcon,
  AppText,
  ErrorView,
  LoadingView,
  ScreenContainer,
} from '@/components';
import {
  useCategories,
  useCategoryTransactionCounts,
} from '@/features/categories/hooks';
import { categoryIconName } from '@/features/categories/options';
import { formatTransactionCount } from '@/features/categories/presentation';
import {
  editCategoryHref,
  newCategoryHref,
} from '@/features/navigation/routes';
import type { Category } from '@/domain/types';
import { useTheme, type Theme } from '@/theme';

export function CategoriesScreen() {
  const router = useRouter();
  const categories = useCategories();
  const counts = useCategoryTransactionCounts();
  const income = (categories.data ?? []).filter(item => item.type === 'income');
  const expenses = (categories.data ?? []).filter(
    item => item.type === 'expense',
  );

  if (categories.isLoading && !categories.data) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <LoadingView message="Carregando categorias" />
      </ScreenContainer>
    );
  }

  if (categories.errorMessage && !categories.data) {
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
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll>
      <AppHeader showBack title="Categorias" />
      <AppButton
        label="Nova categoria"
        onPress={() => router.push(newCategoryHref())}
      />
      <CategorySection
        categories={income}
        countOf={countOf}
        onPress={openCategory}
        title="Receitas"
      />
      <CategorySection
        categories={expenses}
        countOf={countOf}
        onPress={openCategory}
        title="Despesas"
      />
    </ScreenContainer>
  );

  function countOf(category: Category): string | null {
    if (!counts.data) {
      return null;
    }

    return formatTransactionCount(counts.data[category.id] ?? 0);
  }

  function openCategory(category: Category) {
    router.push(editCategoryHref(category.id));
  }
}

function CategorySection({
  title,
  categories,
  countOf,
  onPress,
}: {
  title: string;
  categories: readonly Category[];
  countOf: (category: Category) => string | null;
  onPress: (category: Category) => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <AppText variant="headline">{title}</AppText>
      {categories.map(category => {
        const usage = countOf(category);
        const detail = caption(category, usage);

        return (
          <Pressable
            key={category.id}
            accessibilityLabel={
              detail ? `${category.name}. ${detail}` : category.name
            }
            accessibilityRole="button"
            onPress={() => onPress(category)}
            style={({ pressed }) => [
              styles.row,
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={[styles.badge, { backgroundColor: category.color }]}>
              <AppIcon
                color="#FFFFFF"
                name={categoryIconName(category.icon)}
                size={20}
              />
            </View>
            <View style={styles.copy}>
              <AppText variant="label">{category.name}</AppText>
              {detail ? (
                <AppText color="muted" variant="caption">
                  {detail}
                </AppText>
              ) : null}
            </View>
            <AppIcon color={theme.colors.textSubtle} name="forward" size={18} />
          </Pressable>
        );
      })}
    </View>
  );
}

function caption(category: Category, usage: string | null): string {
  const parts: string[] = [];

  if (category.isDefault) {
    parts.push('Padrão');
  }

  if (usage) {
    parts.push(usage);
  }

  return parts.join(' · ');
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      gap: theme.spacing.sm,
    },
    row: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
    },
    pressed: {
      opacity: 0.88,
    },
    badge: {
      alignItems: 'center',
      borderRadius: theme.radius.pill,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    copy: {
      flex: 1,
      gap: theme.spacing.xs,
    },
  });
}
