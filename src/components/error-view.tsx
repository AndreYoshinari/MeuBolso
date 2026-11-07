import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { useTheme, type Theme } from '@/theme';

type ErrorViewProps = {
  message: string;
  title?: string;
  onRetry?: () => void;
};

export function ErrorView({
  message,
  title = 'Algo deu errado',
  onRetry,
}: ErrorViewProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <AppIcon color={theme.colors.expense} name="alert" size={32} />
      <AppText variant="headline">{title}</AppText>
      <AppText color="muted">{message}</AppText>
      {onRetry ? (
        <AppButton
          label="Tentar de novo"
          onPress={onRetry}
          variant="secondary"
        />
      ) : null}
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
