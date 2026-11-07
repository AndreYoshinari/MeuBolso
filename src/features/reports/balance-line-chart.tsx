import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import type { ReportMonth } from '@/features/reports/model';
import { useTheme, type Theme } from '@/theme';

type BalanceLineChartProps = {
  months: readonly ReportMonth[];
};

export function BalanceLineChart({ months }: BalanceLineChartProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [width, setWidth] = useState(0);
  const values = months.map(month => month.cumulativeCents);
  const lowest = Math.min(0, ...values);
  const highest = Math.max(1, ...values);
  const spacing = Math.max(
    28,
    Math.floor((Math.max(width, 1) - 24) / Math.max(months.length, 1)),
  );

  return (
    <View
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={styles.frame}
    >
      {width > 0 ? (
        <LineChart
          color={theme.colors.primary}
          data={months.map(month => ({
            value: month.cumulativeCents,
            label: month.tick,
          }))}
          dataPointsColor={theme.colors.primary}
          endSpacing={12}
          height={160}
          hideRules
          hideYAxisText
          initialSpacing={16}
          maxValue={highest}
          mostNegativeValue={lowest < 0 ? lowest : undefined}
          noOfSections={3}
          noOfSectionsBelowXAxis={lowest < 0 ? 2 : 0}
          spacing={spacing}
          thickness={2}
          width={width}
          xAxisColor={theme.colors.border}
          yAxisThickness={0}
        />
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    frame: {
      minHeight: 180,
      overflow: 'hidden',
    },
  });
}
