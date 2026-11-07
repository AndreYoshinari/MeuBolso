import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { AppText } from '@/components';
import {
  barChartMax,
  type IncomeExpenseBar,
} from '@/features/dashboard/presentation';
import { formatCurrency } from '@/lib/money';
import { useTheme, type Theme } from '@/theme';

type IncomeExpenseChartProps = {
  bars: readonly IncomeExpenseBar[];
};

export function IncomeExpenseChart({ bars }: IncomeExpenseChartProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [width, setWidth] = useState(0);
  const data = bars.map(bar => ({
    value: bar.value,
    label: bar.label,
    frontColor:
      bar.tone === 'income' ? theme.colors.income : theme.colors.expense,
    topLabelComponent: () => (
      <AppText variant="caption">{formatCurrency(bar.value)}</AppText>
    ),
  }));

  return (
    <View
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={styles.frame}
    >
      {width > 0 ? (
        <BarChart
          barBorderRadius={theme.radius.sm}
          barWidth={42}
          data={data}
          disableScroll
          height={160}
          hideRules
          hideYAxisText
          isAnimated
          maxValue={barChartMax(bars)}
          noOfSections={3}
          spacing={48}
          width={width}
          xAxisColor={theme.colors.border}
          xAxisThickness={1}
          yAxisThickness={0}
        />
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    frame: {
      minHeight: 210,
      overflow: 'hidden',
    },
  });
}
