import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppText,
  EmptyState,
  ErrorView,
  LoadingView,
  ScreenContainer,
} from '@/components';
import { useBudgets } from '@/features/budgets/hooks';
import { PeriodStepper } from '@/features/budgets/period-stepper';
import {
  budgetProgress,
  budgetStatusLabel,
  formatRemaining,
  type BudgetCard,
} from '@/features/budgets/presentation';
import { Meter } from '@/features/navigation/widgets';
import {
  TAB_CONTENT_INSET,
  editBudgetHref,
  newBudgetHref,
} from '@/features/navigation/routes';
import { formatCurrency } from '@/lib/money';
import { formatShare } from '@/lib/percent';
import {
  civilMonthRange,
  formatPeriodLabel,
  formatYearMonth,
  type YearMonth,
} from '@/lib/period';
import { useTheme } from '@/theme';

type BudgetsScreenProps = {
  today?: Date;
};

export function BudgetsScreen({ today = new Date() }: BudgetsScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [period, setPeriod] = useState<YearMonth>(() => {
    const current = civilMonthRange(today);

    return { year: current.year, month: current.month };
  });
  const yearMonth = formatYearMonth(period.year, period.month);
  const budgets = useBudgets(yearMonth);

  if (budgets.isLoading && !budgets.data) {
    return (
      <ScreenContainer bottomInset={TAB_CONTENT_INSET}>
        <LoadingView message="Carregando orçamentos" />
      </ScreenContainer>
    );
  }

  if (budgets.errorMessage && !budgets.data) {
    return (
      <ScreenContainer bottomInset={TAB_CONTENT_INSET}>
        <ErrorView
          message={budgets.errorMessage}
          onRetry={() => {
            void budgets.refetch();
          }}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer bottomInset={TAB_CONTENT_INSET} scroll>
      <AppHeader subtitle={formatPeriodLabel(period)} title="Orçamentos" />
      <PeriodStepper onChange={setPeriod} period={period} />
      <AppButton
        label="Novo orçamento"
        onPress={() => router.push(newBudgetHref(yearMonth))}
      />
      {budgets.data && budgets.data.length === 0 ? (
        <EmptyState
          message="Nenhum limite definido neste mês."
          title="Nenhum orçamento"
        />
      ) : null}
      {budgets.data?.map(card => (
        <BudgetRow
          key={card.id}
          card={card}
          onPress={() => router.push(editBudgetHref(card.id, yearMonth))}
          tone={toneFor(card, theme.colors)}
        />
      ))}
    </ScreenContainer>
  );
}

function BudgetRow({
  card,
  onPress,
  tone,
}: {
  card: BudgetCard;
  onPress: () => void;
  tone: string;
}) {
  const status = budgetStatusLabel(card.level, card.remainingCents);
  const share = formatShare(card.basisPoints);

  return (
    <AppCard
      accessibilityLabel={
        status
          ? `${card.categoryName}. ${share}. ${status}`
          : `${card.categoryName}. ${share}`
      }
      onPress={onPress}
    >
      <AppText variant="headline">{card.categoryName}</AppText>
      {status ? (
        <AppText color={card.level === 'reached' ? 'expense' : 'primary'}>
          {status}
        </AppText>
      ) : null}
      <AppText color="muted">{`Limite ${formatCurrency(card.limitCents)}`}</AppText>
      <AppText color="muted">{`Utilizado ${formatCurrency(card.spentCents)}`}</AppText>
      <AppText color={card.remainingCents < 0 ? 'expense' : 'muted'}>
        {formatRemaining(card.remainingCents)}
      </AppText>
      <Meter color={tone} progress={budgetProgress(card.basisPoints)} />
      <AppText variant="label">{share}</AppText>
    </AppCard>
  );
}

function toneFor(
  card: BudgetCard,
  colors: { expense: string; primary: string; income: string },
): string {
  if (card.level === 'reached') {
    return colors.expense;
  }

  if (card.level === 'warning') {
    return colors.primary;
  }

  return colors.income;
}
