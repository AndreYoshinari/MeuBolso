import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { routes } from '@/features/navigation/routes';
import { useTheme, type Theme } from '@/theme';

type NewTransactionButtonProps = {
  bottom: number;
};

export function NewTransactionButton({ bottom }: NewTransactionButtonProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, bottom), [theme, bottom]);

  return (
    <Pressable
      accessibilityLabel="Nova transação"
      accessibilityRole="button"
      onPress={() => router.push(routes.newTransaction)}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      <AppIcon color={theme.colors.onPrimary} name="plus" size={28} />
    </Pressable>
  );
}

function createStyles(theme: Theme, bottom: number) {
  return StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.pill,
      bottom,
      elevation: 6,
      height: 56,
      justifyContent: 'center',
      position: 'absolute',
      right: theme.spacing.lg,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      width: 56,
      zIndex: 2,
    },
    pressed: {
      backgroundColor: theme.colors.primaryPressed,
    },
  });
}
