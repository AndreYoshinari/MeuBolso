import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme, type Theme } from '@/theme';

type AppCardProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function AppCard({
  children,
  onPress,
  accessibilityLabel,
}: AppCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={styles.card}>{children}</View>;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    pressed: {
      opacity: 0.9,
    },
  });
}
