import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppHeader,
  AppIcon,
  AppInput,
  AppText,
  EmptyState,
  ErrorView,
  LoadingView,
  ScreenContainer,
  TransactionItem,
} from '@/components';
import { useCategories } from '@/features/categories/hooks';
import { ChoiceChip } from '@/features/navigation/widgets';
import {
  TAB_CONTENT_INSET,
  newTransactionHref,
  transactionHref,
} from '@/features/navigation/routes';
import {
  useTransactionFilters,
  useTransactions,
} from '@/features/transactions/hooks';
import type { AmountKind } from '@/lib/money';
import {
  civilMonthRange,
  formatCivilDate,
  periodFromCivilDate,
  shiftYearMonth,
  type YearMonth,
} from '@/lib/period';
import {
  filtersForMonth,
  periodLabelForFilters,
} from '@/lib/transaction-filters';
import { useTheme, type Theme } from '@/theme';

export function TransactionsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { filters, setFilters } = useTransactionFilters();
  const transactions = useTransactions(filters);
  const categories = useCategories();
  const [search, setSearch] = useState(filters.query ?? '');
  const today = civilMonthRange(new Date());
  const period =
    periodFromCivilDate(filters.from) ??
    ({ year: today.year, month: today.month } satisfies YearMonth);
  const previous = shiftYearMonth(period, -1);
  const next = shiftYearMonth(period, 1);
  const names = new Map(
    (categories.data ?? []).map(category => [category.id, category.name]),
  );
  const visibleCategories = (categories.data ?? []).filter(category =>
    filters.type ? category.type === filters.type : true,
  );

  return (
    <ScreenContainer bottomInset={TAB_CONTENT_INSET} scroll>
      <AppHeader title="Transações" />
      <View style={styles.period}>
        <Pressable
          accessibilityLabel="Mês anterior"
          accessibilityRole="button"
          accessibilityState={{ disabled: samePeriod(previous, period) }}
          disabled={samePeriod(previous, period)}
          onPress={() => setFilters(filtersForMonth(filters, previous))}
          style={styles.iconButton}
        >
          <AppIcon name="back" />
        </Pressable>
        <AppText variant="headline">{periodLabelForFilters(filters)}</AppText>
        <Pressable
          accessibilityLabel="Mês seguinte"
          accessibilityRole="button"
          accessibilityState={{ disabled: samePeriod(next, period) }}
          disabled={samePeriod(next, period)}
          onPress={() => setFilters(filtersForMonth(filters, next))}
          style={styles.iconButton}
        >
          <AppIcon name="forward" />
        </Pressable>
      </View>
      <AppInput
        autoCapitalize="none"
        label="Pesquisar"
        onChangeText={onSearch}
        placeholder="Descrição"
        value={search}
      />
      <View style={styles.choices}>
        <ChoiceChip
          label="Todas"
          onPress={() => selectType(undefined)}
          selected={filters.type === undefined}
        />
        <ChoiceChip
          label="Receitas"
          onPress={() => selectType('income')}
          selected={filters.type === 'income'}
        />
        <ChoiceChip
          label="Despesas"
          onPress={() => selectType('expense')}
          selected={filters.type === 'expense'}
        />
      </View>
      <View style={styles.choices}>
        <ChoiceChip
          label="Todas as categorias"
          onPress={() => setFilters({ ...filters, categoryId: undefined })}
          selected={filters.categoryId === undefined}
        />
        {visibleCategories.map(category => (
          <ChoiceChip
            key={category.id}
            label={category.name}
            onPress={() => setFilters({ ...filters, categoryId: category.id })}
            selected={filters.categoryId === category.id}
          />
        ))}
      </View>
      {transactions.isLoading && !transactions.data ? (
        <LoadingView message="Carregando lançamentos" />
      ) : null}
      {transactions.errorMessage && !transactions.data ? (
        <ErrorView
          message={transactions.errorMessage}
          onRetry={() => {
            void transactions.refetch();
          }}
        />
      ) : null}
      {transactions.data && transactions.data.length === 0 ? (
        <EmptyState
          actionLabel="Nova transação"
          message="Nenhum lançamento encontrado."
          onAction={() => router.push(newTransactionHref('expense'))}
          title="Nenhum lançamento"
        />
      ) : null}
      {transactions.data?.map(item => (
        <TransactionItem
          key={item.id}
          amountCents={item.amountCents}
          category={names.get(item.categoryId) ?? 'Categoria'}
          dateLabel={formatCivilDate(item.date)}
          kind={item.type}
          onPress={() => router.push(transactionHref(item.id))}
          title={item.description}
        />
      ))}
    </ScreenContainer>
  );

  function onSearch(text: string) {
    setSearch(text);
    const query = text.trim();
    setFilters({ ...filters, query: query === '' ? undefined : query });
  }

  function selectType(type: AmountKind | undefined) {
    const selected = (categories.data ?? []).find(
      category => category.id === filters.categoryId,
    );
    const categoryStillVisible =
      selected !== undefined && (type === undefined || selected.type === type);

    setFilters({
      ...filters,
      type,
      categoryId: categoryStillVisible ? selected.id : undefined,
    });
  }
}

function samePeriod(left: YearMonth, right: YearMonth): boolean {
  return left.year === right.year && left.month === right.month;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    period: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    iconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    choices: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });
}
