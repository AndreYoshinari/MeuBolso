import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme, type Theme } from '@/theme';

export function AppDivider() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <View accessibilityRole="none" style={styles.line} />;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    line: {
      backgroundColor: theme.colors.border,
      height: StyleSheet.hairlineWidth,
      width: '100%',
    },
  });
}
