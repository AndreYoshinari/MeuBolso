import { useRouter } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { useTheme, type Theme } from '@/theme';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: ReactNode;
};

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  action,
}: AppHeaderProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.back}
        >
          <AppIcon color={theme.colors.text} name="back" />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <AppText accessibilityRole="header" variant="title">
          {title}
        </AppText>
        {subtitle ? (
          <AppText color="muted" variant="caption">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      minHeight: 48,
    },
    back: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    titles: {
      flex: 1,
      gap: theme.spacing.xs,
    },
  });
}
