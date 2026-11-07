import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useTheme, type Theme } from '@/theme';

type LoadingViewProps = {
  message?: string;
};

export function LoadingView({ message = 'Carregando' }: LoadingViewProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={styles.container}
    >
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <AppText color="muted">{message}</AppText>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      flex: 1,
      gap: theme.spacing.md,
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
  });
}
