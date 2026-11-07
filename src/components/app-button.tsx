import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useTheme, type Theme } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: AppButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = disabled || loading;
  const textColor =
    variant === 'danger'
      ? 'expense'
      : variant === 'secondary' || variant === 'ghost'
        ? 'primary'
        : 'onPrimary';
  const indicatorColor =
    variant === 'primary' ? theme.colors.onPrimary : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <View>
          <AppText color={textColor} variant="label">
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      borderRadius: theme.radius.md,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: theme.colors.expenseSurface,
      borderColor: theme.colors.expense,
      borderWidth: 1,
    },
    pressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.4,
    },
  });
}
