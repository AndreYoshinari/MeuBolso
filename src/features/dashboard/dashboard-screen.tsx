import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppCard,
  AppHeader,
  AppIcon,
  AppText,
  CurrencyText,
  EmptyState,
  ErrorView,
  LoadingView,
  ScreenContainer,
  TransactionItem,
} from '@/components';
import { CategoryShareChart } from '@/features/dashboard/category-share-chart';
import { useDashboard } from '@/features/dashboard/hooks';
import { IncomeExpenseChart } from '@/features/dashboard/income-expense-chart';
import {
  categorySlices,
  greetingForHour,
  incomeExpenseBars,
  isEmptyPeriod,
} from '@/features/dashboard/presentation';
import {
  TAB_CONTENT_INSET,
  newTransactionHref,
  routes,
  transactionHref,
} from '@/features/navigation/routes';
import { formatCurrency } from '@/lib/money';
import {
  civilMonthRange,
  formatCivilDate,
  formatPeriodLabel,
  formatYearMonth,
  shiftYearMonth,
  type YearMonth,
} from '@/lib/period';
import { usePreferencesStore } from '@/stores/preferences';
import { useTheme, type Theme } from '@/theme';

type DashboardScreenProps = {
  today?: Date;
};

export function DashboardScreen({ today = new Date() }: DashboardScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [period, setPeriod] = useState<YearMonth>(() => {
    const current = civilMonthRange(today);

    return { year: current.year, month: current.month };
  });
  const yearMonth = formatYearMonth(period.year, period.month);
  const dashboard = useDashboard(yearMonth);
  const previous = shiftYearMonth(period, -1);
  const next = shiftYearMonth(period, 1);
  const displayName = usePreferencesStore(state => state.displayName);
  const data = dashboard.data;
  const slices = data
    ? categorySlices(data.expenses, [
        theme.colors.primary,
        theme.colors.expense,
        theme.colors.income,
        theme.colors.textMuted,
      ])
    : [];

  return (
    <ScreenContainer bottomInset={TAB_CONTENT_INSET} scroll>
      <AppHeader
        action={
          <Pressable
            accessibilityLabel="Configurações"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push(routes.settings)}
            style={styles.iconButton}
          >
            <AppIcon name="settings" />
          </Pressable>
        }
        title="Início"
      />
      <View style={styles.intro}>
        <AppText variant="title">
          {greetingForHour(today.getHours(), displayName)}
        </AppText>
        <AppText color="muted">Seu mês, em reais.</AppText>
      </View>
      <View style={styles.period}>
        <Pressable
          accessibilityLabel="Mês anterior"
          accessibilityRole="button"
          accessibilityState={{ disabled: samePeriod(previous, period) }}
          disabled={samePeriod(previous, period)}
          onPress={() => setPeriod(previous)}
          style={styles.iconButton}
        >
          <AppIcon name="back" />
        </Pressable>
        <AppText variant="headline">{formatPeriodLabel(period)}</AppText>
        <Pressable
          accessibilityLabel="Mês seguinte"
          accessibilityRole="button"
          accessibilityState={{ disabled: samePeriod(next, period) }}
          disabled={samePeriod(next, period)}
          onPress={() => setPeriod(next)}
          style={styles.iconButton}
        >
          <AppIcon name="forward" />
        </Pressable>
      </View>
      {dashboard.isLoading && !data ? (
        <LoadingView message="Carregando o início" />
      ) : null}
      {dashboard.errorMessage && !data ? (
        <ErrorView
          message={dashboard.errorMessage}
          onRetry={() => void dashboard.refetch()}
        />
      ) : null}
      {data ? (
        <View style={styles.sections}>
          <AppCard>
            <AppText color="muted" variant="label">
              Saldo total
            </AppText>
            <CurrencyText
              amountCents={data.totalBalanceCents}
              variant="display"
            />
          </AppCard>
          <View style={styles.split}>
            <View style={styles.metric}>
              <AppCard>
                <AppText color="muted" variant="caption">
                  Receitas do mês
                </AppText>
                <CurrencyText
                  amountCents={data.summary.incomeCents}
                  kind="income"
                  variant="title"
                />
              </AppCard>
            </View>
            <View style={styles.metric}>
              <AppCard>
                <AppText color="muted" variant="caption">
                  Despesas do mês
                </AppText>
                <CurrencyText
                  amountCents={data.summary.expenseCents}
                  kind="expense"
                  variant="title"
                />
              </AppCard>
            </View>
          </View>
          {isEmptyPeriod(data.summary) ? (
            <EmptyState
              message="Quando houver um lançamento neste mês, o saldo do período aparece aqui."
              title="Nenhum lançamento neste mês"
            />
          ) : (
            <>
              <AppCard>
                <AppText variant="headline">Receitas e despesas</AppText>
                <IncomeExpenseChart bars={incomeExpenseBars(data.summary)} />
              </AppCard>
              {slices.length > 0 ? (
                <AppCard>
                  <AppText variant="headline">Despesas por categoria</AppText>
                  <CategoryShareChart
                    centerLabel={formatCurrency(data.summary.expenseCents)}
                    slices={slices}
                  />
                </AppCard>
              ) : null}
              <AppText variant="headline">Últimas transações</AppText>
              {data.recent.map(transaction => (
                <TransactionItem
                  key={transaction.id}
                  amountCents={transaction.amountCents}
                  category={transaction.categoryName}
                  dateLabel={formatCivilDate(transaction.date)}
                  kind={transaction.type}
                  onPress={() => router.push(transactionHref(transaction.id))}
                  title={transaction.description}
                />
              ))}
            </>
          )}
        </View>
      ) : null}
      <View style={styles.shortcuts}>
        <Pressable
          accessibilityLabel="Nova receita"
          accessibilityRole="button"
          onPress={() => router.push(newTransactionHref('income'))}
          style={styles.incomeShortcut}
        >
          <AppIcon color={theme.colors.income} name="income" />
          <AppText variant="label">Nova receita</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel="Nova despesa"
          accessibilityRole="button"
          onPress={() => router.push(newTransactionHref('expense'))}
          style={styles.expenseShortcut}
        >
          <AppIcon color={theme.colors.expense} name="expense" />
          <AppText variant="label">Nova despesa</AppText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function samePeriod(left: YearMonth, right: YearMonth): boolean {
  return left.year === right.year && left.month === right.month;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    iconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    intro: {
      gap: theme.spacing.xs,
    },
    period: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sections: {
      gap: theme.spacing.lg,
    },
    split: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    metric: {
      flex: 1,
    },
    shortcuts: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    incomeShortcut: {
      alignItems: 'center',
      backgroundColor: theme.colors.incomeSurface,
      borderRadius: theme.radius.lg,
      flex: 1,
      gap: theme.spacing.sm,
      minHeight: 88,
      justifyContent: 'center',
      padding: theme.spacing.md,
    },
    expenseShortcut: {
      alignItems: 'center',
      backgroundColor: theme.colors.expenseSurface,
      borderRadius: theme.radius.lg,
      flex: 1,
      gap: theme.spacing.sm,
      justifyContent: 'center',
      minHeight: 88,
      padding: theme.spacing.md,
    },
  });
}
