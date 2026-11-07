import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, AppText } from '@/components';
import {
  formatPeriodLabel,
  shiftYearMonth,
  type YearMonth,
} from '@/lib/period';
import { useTheme, type Theme } from '@/theme';

type PeriodStepperProps = {
  period: YearMonth;
  onChange: (period: YearMonth) => void;
  previousLabel?: string;
  nextLabel?: string;
};

export function PeriodStepper({
  period,
  onChange,
  previousLabel = 'Mês anterior',
  nextLabel = 'Mês seguinte',
}: PeriodStepperProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const previous = shiftYearMonth(period, -1);
  const next = shiftYearMonth(period, 1);

  return (
    <View style={styles.period}>
      <Pressable
        accessibilityLabel={previousLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: samePeriod(previous, period) }}
        disabled={samePeriod(previous, period)}
        onPress={() => onChange(previous)}
        style={styles.iconButton}
      >
        <AppIcon name="back" />
      </Pressable>
      <AppText variant="headline">{formatPeriodLabel(period)}</AppText>
      <Pressable
        accessibilityLabel={nextLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: samePeriod(next, period) }}
        disabled={samePeriod(next, period)}
        onPress={() => onChange(next)}
        style={styles.iconButton}
      >
        <AppIcon name="forward" />
      </Pressable>
    </View>
  );
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
  });
}
