import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { AppText } from '@/components';
import { barChartMax } from '@/features/dashboard/presentation';
import type { ReportMonth } from '@/features/reports/model';
import { useTheme, type Theme } from '@/theme';

type MonthlyBarsChartProps = {
  months: readonly ReportMonth[];
};

export function MonthlyBarsChart({ months }: MonthlyBarsChartProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [width, setWidth] = useState(0);
  const bars = months.flatMap(month => [
    {
      value: month.incomeCents,
      label: '',
      frontColor: theme.colors.income,
      spacing: 4,
    },
    {
      value: month.expenseCents,
      label: month.tick,
      frontColor: theme.colors.expense,
      spacing: 16,
    },
  ]);

  return (
    <View style={styles.block}>
      <View style={styles.legend}>
        <Legend color={theme.colors.income} label="Receitas" />
        <Legend color={theme.colors.expense} label="Despesas" />
      </View>
      <View
        onLayout={event => setWidth(event.nativeEvent.layout.width)}
        style={styles.frame}
      >
        {width > 0 ? (
          <BarChart
            barBorderRadius={theme.radius.sm}
            barWidth={12}
            data={bars}
            endSpacing={12}
            height={160}
            hideRules
            hideYAxisText
            initialSpacing={12}
            maxValue={barChartMax(bars)}
            noOfSections={3}
            width={width}
            xAxisColor={theme.colors.border}
            xAxisThickness={1}
            yAxisThickness={0}
          />
        ) : null}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    block: {
      gap: theme.spacing.sm,
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    legendItem: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    dot: {
      borderRadius: theme.radius.pill,
      height: 10,
      width: 10,
    },
    frame: {
      minHeight: 180,
      overflow: 'hidden',
    },
  });
}
