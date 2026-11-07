import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { AppText, CurrencyText } from '@/components';
import {
  formatShare,
  type CategorySlice,
} from '@/features/dashboard/presentation';
import { useTheme, type Theme } from '@/theme';

type CategoryShareChartProps = {
  slices: readonly CategorySlice[];
  centerLabel: string;
};

export function CategoryShareChart({
  slices,
  centerLabel,
}: CategoryShareChartProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.block}>
      <View style={styles.chart}>
        <PieChart
          centerLabelComponent={() => (
            <AppText variant="label">{centerLabel}</AppText>
          )}
          data={slices.map(slice => ({
            value: slice.value,
            color: slice.color,
          }))}
          donut
          innerCircleColor={theme.colors.surface}
          innerRadius={46}
          radius={78}
        />
      </View>
      {slices.map(slice => (
        <View key={slice.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: slice.color }]} />
          <View style={styles.copy}>
            <AppText numberOfLines={1} variant="label">
              {slice.name}
            </AppText>
            <AppText color="muted" variant="caption">
              {formatShare(slice.basisPoints)}
            </AppText>
          </View>
          <CurrencyText
            amountCents={slice.value}
            kind="expense"
            variant="label"
          />
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    block: {
      gap: theme.spacing.md,
    },
    chart: {
      alignItems: 'center',
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    dot: {
      borderRadius: theme.radius.pill,
      height: 12,
      width: 12,
    },
    copy: {
      flex: 1,
      gap: theme.spacing.xs,
      minWidth: 0,
    },
  });
}
