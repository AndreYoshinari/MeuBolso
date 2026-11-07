import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useTheme, type Theme } from '@/theme';

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
};

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
}: AppInputProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, Boolean(error)),
    [theme, error],
  );

  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : undefined}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSubtle}
        secureTextEntry={secureTextEntry}
        selectionColor={theme.colors.primary}
        style={[styles.input, multiline ? styles.multiline : null]}
        textAlignVertical={multiline ? 'top' : 'auto'}
        value={value}
      />
      {error ? (
        <AppText color="expense" variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme, hasError: boolean) {
  return StyleSheet.create({
    field: {
      gap: theme.spacing.sm,
    },
    input: {
      ...theme.typography.body,
      backgroundColor: theme.colors.surface,
      borderColor: hasError ? theme.colors.expense : theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      color: theme.colors.text,
      minHeight: 48,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    multiline: {
      minHeight: 120,
    },
  });
}
