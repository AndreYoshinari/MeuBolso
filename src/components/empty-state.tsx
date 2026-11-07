import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppIcon, type IconName } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { useTheme, type Theme } from '@/theme';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  message,
  icon = 'empty',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <AppIcon color={theme.colors.primary} name={icon} size={28} />
      </View>
      <AppText variant="headline">{title}</AppText>
      <AppText color="muted">{message}</AppText>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.xl,
    },
    icon: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.pill,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
  });
}
