import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppIcon,
  AppInput,
  AppText,
  ScreenContainer,
} from '@/components';
import {
  categoryColors,
  categoryIconLabels,
  categoryIcons,
} from '@/features/categories/options';
import {
  categoryFormSchema,
  type CategoryFormValues,
} from '@/features/categories/schema';
import { ChoiceChip } from '@/features/navigation/widgets';
import type { AmountKind } from '@/lib/money';
import { useTheme, type Theme } from '@/theme';

type CategoryFormProps = {
  title: string;
  submitLabel: string;
  defaultValues: CategoryFormValues;
  errorMessage: string | null;
  isPending: boolean;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  onDelete?: () => void;
  deletePending?: boolean;
  notice?: string;
};

export function CategoryForm({
  title,
  submitLabel,
  defaultValues,
  errorMessage,
  isPending,
  onSubmit,
  onDelete,
  deletePending = false,
  notice,
}: CategoryFormProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  });
  const type = useWatch({ control, name: 'type' });
  const icon = useWatch({ control, name: 'icon' });
  const color = useWatch({ control, name: 'color' });
  const colors = (categoryColors as readonly string[]).includes(color)
    ? [...categoryColors]
    : [...categoryColors, color];

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll>
      <AppHeader showBack title={title} />
      {notice ? <AppText color="muted">{notice}</AppText> : null}
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <AppInput
            error={errors.name?.message}
            label="Nome"
            onChangeText={field.onChange}
            placeholder="Presentes"
            value={field.value}
          />
        )}
      />
      <View style={styles.choices}>
        <ChoiceChip
          label="Despesa"
          onPress={() => selectType('expense')}
          selected={type === 'expense'}
        />
        <ChoiceChip
          label="Receita"
          onPress={() => selectType('income')}
          selected={type === 'income'}
        />
      </View>
      <AppText variant="label">Ícone</AppText>
      <View style={styles.choices}>
        {categoryIcons.map(name => (
          <Pressable
            key={name}
            accessibilityLabel={categoryIconLabels[name]}
            accessibilityRole="button"
            accessibilityState={{ selected: icon === name }}
            onPress={() =>
              setValue('icon', name, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            style={[styles.iconButton, icon === name ? styles.selected : null]}
          >
            <AppIcon
              color={icon === name ? theme.colors.onPrimary : theme.colors.text}
              name={name}
              size={22}
            />
          </Pressable>
        ))}
      </View>
      {errors.icon?.message ? (
        <AppText color="expense" variant="caption">
          {errors.icon.message}
        </AppText>
      ) : null}
      <AppText variant="label">Cor</AppText>
      <View style={styles.choices}>
        {colors.map(item => (
          <Pressable
            key={item}
            accessibilityLabel={`Cor ${item}`}
            accessibilityRole="button"
            accessibilityState={{ selected: color === item }}
            onPress={() =>
              setValue('color', item, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            style={[
              styles.swatch,
              { backgroundColor: item },
              color === item ? styles.swatchSelected : null,
            ]}
          />
        ))}
      </View>
      {errors.color?.message ? (
        <AppText color="expense" variant="caption">
          {errors.color.message}
        </AppText>
      ) : null}
      {errorMessage ? <AppText color="expense">{errorMessage}</AppText> : null}
      <AppButton
        label={submitLabel}
        disabled={isPending}
        loading={isPending}
        onPress={() => {
          void handleSubmit(async values => {
            await onSubmit(values);
          })();
        }}
      />
      {onDelete ? (
        <AppButton
          disabled={deletePending}
          label="Excluir"
          loading={deletePending}
          onPress={onDelete}
          variant="danger"
        />
      ) : null}
    </ScreenContainer>
  );

  function selectType(next: AmountKind) {
    setValue('type', next, { shouldDirty: true, shouldValidate: true });
  }
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    choices: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    iconButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    selected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    swatch: {
      borderColor: 'transparent',
      borderRadius: theme.radius.pill,
      borderWidth: 2,
      height: 36,
      width: 36,
    },
    swatchSelected: {
      borderColor: theme.colors.text,
    },
  });
}
