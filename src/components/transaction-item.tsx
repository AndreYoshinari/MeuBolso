import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { CurrencyText } from '@/components/currency-text';
import type { AmountKind } from '@/lib/money';
import { useTheme, type Theme } from '@/theme';

type TransactionItemProps = {
  title: string;
  category: string;
  dateLabel: string;
  amountCents: number;
  kind: AmountKind;
  onPress?: () => void;
};

export function TransactionItem({
  title,
  category,
  dateLabel,
  amountCents,
  kind,
  onPress,
}: TransactionItemProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, kind), [theme, kind]);
  const content = (
    <>
      <View style={styles.icon}>
        <AppIcon
          color={kind === 'income' ? theme.colors.income : theme.colors.expense}
          name={kind}
          size={22}
        />
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1} variant="label">
          {title}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {`${category} · ${dateLabel}`}
        </AppText>
      </View>
      <View style={styles.amount}>
        <CurrencyText amountCents={amountCents} kind={kind} variant="label" />
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View accessibilityRole="summary" style={styles.row}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

function createStyles(theme: Theme, kind: AmountKind) {
  return StyleSheet.create({
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
    icon: {
      alignItems: 'center',
      backgroundColor:
        kind === 'income'
          ? theme.colors.incomeSurface
          : theme.colors.expenseSurface,
      borderRadius: theme.radius.pill,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    copy: {
      flex: 1,
      gap: theme.spacing.xs,
      minWidth: 0,
    },
    amount: {
      flexShrink: 0,
    },
  });
}
