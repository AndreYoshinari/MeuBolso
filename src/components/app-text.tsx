import { Text, type AccessibilityRole } from 'react-native';

import { useTheme } from '@/theme';
import type { TextVariant } from '@/theme/typography';

type TextColor =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'primary'
  | 'income'
  | 'expense'
  | 'inverse'
  | 'onPrimary';

type AppTextProps = {
  children: string | number;
  variant?: TextVariant;
  color?: TextColor;
  numberOfLines?: number;
  accessibilityRole?: AccessibilityRole;
};

export function AppText({
  children,
  variant = 'body',
  color = 'default',
  numberOfLines,
  accessibilityRole,
}: AppTextProps) {
  const { theme } = useTheme();
  const colorByName: Record<TextColor, string> = {
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    subtle: theme.colors.textSubtle,
    primary: theme.colors.primary,
    income: theme.colors.income,
    expense: theme.colors.expense,
    inverse: theme.colors.background,
    onPrimary: theme.colors.onPrimary,
  };

  return (
    <Text
      accessibilityRole={accessibilityRole}
      numberOfLines={numberOfLines}
      style={[theme.typography[variant], { color: colorByName[color] }]}
    >
      {children}
    </Text>
  );
}
