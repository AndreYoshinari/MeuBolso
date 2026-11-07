import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, type IconName } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { useTheme, type Theme } from '@/theme';

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function ChoiceChip({ label, selected, onPress }: ChoiceChipProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createChipStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : null]}
    >
      <AppText color={selected ? 'onPrimary' : 'default'} variant="label">
        {label}
      </AppText>
    </Pressable>
  );
}

type MeterProps = {
  progress: number;
  color: string;
};

export function Meter({ progress, color }: MeterProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createMeterStyles(theme), [theme]);
  const filled = Math.min(1, Math.max(0, progress));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { flex: filled, backgroundColor: color }]} />
      <View style={[styles.rest, { flex: 1 - filled }]} />
    </View>
  );
}

type NavigationRowProps = {
  label: string;
  detail: string;
  icon: IconName;
  onPress: () => void;
};

export function NavigationRow({
  label,
  detail,
  icon,
  onPress,
}: NavigationRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createRowStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <AppIcon color={theme.colors.primary} name={icon} size={22} />
      <View style={styles.copy}>
        <AppText variant="label">{label}</AppText>
        <AppText color="muted" variant="caption">
          {detail}
        </AppText>
      </View>
      <AppIcon color={theme.colors.textSubtle} name="forward" size={18} />
    </Pressable>
  );
}

function createChipStyles(theme: Theme) {
  return StyleSheet.create({
    chip: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: theme.spacing.lg,
    },
    selected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
  });
}

function createMeterStyles(theme: Theme) {
  return StyleSheet.create({
    track: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.pill,
      flexDirection: 'row',
      height: 8,
      overflow: 'hidden',
    },
    fill: {
      borderRadius: theme.radius.pill,
    },
    rest: {
      minWidth: 0,
    },
  });
}

function createRowStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: theme.spacing.md,
      minHeight: 64,
      padding: theme.spacing.md,
    },
    copy: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    pressed: {
      opacity: 0.88,
    },
  });
}
