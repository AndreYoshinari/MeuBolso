import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/theme';

type ScreenContainerProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edges;
  bottomInset?: number;
};

export function ScreenContainer({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  bottomInset = 0,
}: ScreenContainerProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, bottomInset),
    [theme, bottomInset],
  );

  return (
    <SafeAreaView edges={edges} style={styles.screen}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

function createStyles(theme: Theme, bottomInset: number) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      gap: theme.spacing.lg,
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.lg + bottomInset,
    },
    fill: {
      flex: 1,
    },
  });
}
