import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppCard,
  AppHeader,
  AppText,
  CurrencyText,
  EmptyState,
  ErrorView,
  LoadingView,
  ScreenContainer,
} from '@/components';
import { CategoryShareChart } from '@/features/dashboard/category-share-chart';
import { categorySlices } from '@/features/dashboard/presentation';
import { PeriodStepper } from '@/features/budgets/period-stepper';
import { TAB_CONTENT_INSET } from '@/features/navigation/routes';
import { ChoiceChip } from '@/features/navigation/widgets';
import { useReport } from '@/features/reports/hooks';
import { BalanceLineChart } from '@/features/reports/balance-line-chart';
import {
  clampReportRange,
  rangeForPreset,
  type ComparisonMonth,
  type FinancialReport,
  type ReportMonth,
  type ReportPreset,
  type ReportRange,
} from '@/features/reports/model';
import { MonthlyBarsChart } from '@/features/reports/monthly-bars-chart';
import { formatCurrency, formatSignedCurrency } from '@/lib/money';
import { formatShare } from '@/lib/percent';
import type { YearMonth } from '@/lib/period';
import { useTheme, type Theme } from '@/theme';

const presets: { id: ReportPreset; label: string }[] = [
  { id: 'current', label: 'Mês atual' },
  { id: 'previous', label: 'Mês anterior' },
  { id: 'last3', label: '3 meses' },
  { id: 'last6', label: '6 meses' },
  { id: 'year', label: 'Ano atual' },
  { id: 'custom', label: 'Personalizado' },
];

type ReportsScreenProps = {
  today?: Date;
};

export function ReportsScreen({ today = new Date() }: ReportsScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [preset, setPreset] = useState<ReportPreset>('current');
  const [custom, setCustom] = useState<ReportRange>(() =>
    rangeForPreset('current', today),
  );
  const range = clampReportRange(
    preset === 'custom' ? custom : rangeForPreset(preset, today),
  );
  const report = useReport(range);
  const data = report.data;

  function selectPreset(next: ReportPreset) {
    if (next === 'custom') {
      setCustom(range);
    }

    setPreset(next);
  }

  return (
    <ScreenContainer bottomInset={TAB_CONTENT_INSET} scroll>
      <AppHeader subtitle={data?.label} title="Relatórios" />
      <View style={styles.filters}>
        {presets.map(item => (
          <ChoiceChip
            key={item.id}
            label={item.label}
            onPress={() => selectPreset(item.id)}
            selected={preset === item.id}
          />
        ))}
      </View>
      {preset === 'custom' ? (
        <View style={styles.section}>
          <AppText variant="label">De</AppText>
          <PeriodStepper
            nextLabel="De, mês seguinte"
            onChange={next =>
              setCustom(current =>
                clampReportRange({ from: next, to: current.to }),
              )
            }
            period={range.from}
            previousLabel="De, mês anterior"
          />
          <AppText variant="label">Até</AppText>
          <PeriodStepper
            nextLabel="Até, mês seguinte"
            onChange={next =>
              setCustom(current =>
                clampReportRange({ from: current.from, to: next }),
              )
            }
            period={range.to}
            previousLabel="Até, mês anterior"
          />
        </View>
      ) : null}
      {report.isLoading && !data ? (
        <LoadingView message="Carregando os relatórios" />
      ) : null}
      {report.errorMessage && !data ? (
        <ErrorView
          message={report.errorMessage}
          onRetry={() => {
            void report.refetch();
          }}
        />
      ) : null}
      {data?.empty ? (
        <EmptyState
          message="Registre receitas ou despesas para ver os gráficos deste período."
          title="Nenhum lançamento neste período"
        />
      ) : null}
      {data && !data.empty ? <ReportBody report={data} /> : null}
    </ScreenContainer>
  );
}

function ReportBody({ report }: { report: FinancialReport }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const slices = categorySlices(report.chartCategories, [
    theme.colors.expense,
    theme.colors.primary,
    theme.colors.income,
    '#F0A202',
    '#4C8DFF',
    '#8E8E93',
  ]);

  return (
    <View style={styles.section}>
      <AppCard>
        <View style={styles.section}>
          <AppText color="muted" variant="label">
            Saldo do período
          </AppText>
          <CurrencyText amountCents={report.balanceCents} variant="title" />
          <AppText numberOfLines={2}>
            {`Receitas ${formatCurrency(report.incomeCents)}`}
          </AppText>
          <AppText numberOfLines={2}>
            {`Despesas ${formatCurrency(report.expenseCents)}`}
          </AppText>
          <AppText color="muted" variant="caption">
            {report.spendingBasisPoints === null
              ? 'Sem receitas no período'
              : `${formatShare(report.spendingBasisPoints)} das receitas`}
          </AppText>
        </View>
      </AppCard>

      <Section title="Receitas e despesas">
        <MonthlyBarsChart months={report.months} />
        {report.months.map(month => (
          <MonthValues key={monthKey(month)} month={month} />
        ))}
      </Section>

      <Section title="Despesas por categoria">
        {slices.length === 0 ? (
          <AppText color="muted">Nenhuma despesa neste período.</AppText>
        ) : (
          <CategoryShareChart centerLabel="Gastos" slices={slices} />
        )}
      </Section>

      <Section title="Evolução do saldo">
        <BalanceLineChart months={report.months} />
        {report.months.map(month => (
          <View key={monthKey(month)} style={styles.row}>
            <View style={styles.copy}>
              <AppText numberOfLines={1} variant="label">
                {month.label}
              </AppText>
            </View>
            <CurrencyText amountCents={month.cumulativeCents} variant="label" />
          </View>
        ))}
      </Section>

      <Section title="Comparação entre meses">
        {report.comparison.length > report.months.length ? (
          <AppText color="muted" variant="caption">
            Inclui o mês anterior para comparar.
          </AppText>
        ) : null}
        {report.comparison.map(month => (
          <ComparisonRow key={monthKey(month)} month={month} />
        ))}
      </Section>

      <Section title="Maiores gastos">
        {report.topCategories.length === 0 ? (
          <AppText color="muted">Nenhuma despesa neste período.</AppText>
        ) : (
          report.topCategories.map((category, index) => (
            <View key={category.categoryId} style={styles.row}>
              <View style={styles.copy}>
                <AppText numberOfLines={1} variant="label">
                  {`${index + 1}. ${category.categoryName}`}
                </AppText>
                <AppText color="muted" variant="caption">
                  {formatShare(category.basisPoints)}
                </AppText>
              </View>
              <CurrencyText
                amountCents={category.spentCents}
                kind="expense"
                variant="label"
              />
            </View>
          ))
        )}
      </Section>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AppCard>
      <View style={styles.section}>
        <AppText variant="headline">{title}</AppText>
        {children}
      </View>
    </AppCard>
  );
}

function MonthValues({ month }: { month: ReportMonth }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <AppText numberOfLines={1} variant="label">
          {month.label}
        </AppText>
        <AppText color="muted" variant="caption">
          {`Receitas ${formatCurrency(month.incomeCents)}`}
        </AppText>
        <AppText color="muted" variant="caption">
          {`Despesas ${formatCurrency(month.expenseCents)} · ${formatShare(month.spendingBasisPoints)}`}
        </AppText>
      </View>
      <CurrencyText amountCents={month.balanceCents} variant="label" />
    </View>
  );
}

function ComparisonRow({ month }: { month: ComparisonMonth }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <AppText numberOfLines={2} variant="label">
            {month.label}
          </AppText>
          <AppText color="muted" variant="caption">
            {`Receitas ${formatCurrency(month.incomeCents)}`}
          </AppText>
          <AppText color="muted" variant="caption">
            {`Despesas ${formatCurrency(month.expenseCents)}`}
          </AppText>
        </View>
        <CurrencyText amountCents={month.balanceCents} variant="label" />
      </View>
      {month.balanceDeltaCents === null ? null : (
        <AppText color="muted" variant="caption">
          {`Variação do saldo ${formatSignedCurrency(month.balanceDeltaCents)}`}
        </AppText>
      )}
    </View>
  );
}

function monthKey(period: YearMonth): string {
  return `${period.year}-${period.month}`;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    section: {
      gap: theme.spacing.md,
    },
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    copy: {
      flex: 1,
      gap: theme.spacing.xs,
      minWidth: 0,
    },
  });
}
