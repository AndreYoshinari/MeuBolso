import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppInput,
  AppText,
  ScreenContainer,
} from '@/components';
import {
  transactionFormSchema,
  type TransactionFormValues,
} from '@/features/transactions/schema';
import { ChoiceChip } from '@/features/navigation/widgets';
import { maskAmountInput } from '@/lib/amount-input';
import type { AmountKind } from '@/lib/money';
import { useTheme, type Theme } from '@/theme';

type FormCategory = {
  id: string;
  name: string;
  type: AmountKind;
};

type TransactionFormProps = {
  title: string;
  submitLabel: string;
  categories: readonly FormCategory[];
  defaultValues: TransactionFormValues;
  errorMessage: string | null;
  isPending: boolean;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
};

export function TransactionForm({
  title,
  submitLabel,
  categories,
  defaultValues,
  errorMessage,
  isPending,
  onSubmit,
}: TransactionFormProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    setValue,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
  });
  const type = useWatch({ control, name: 'type' });
  const categoryId = useWatch({ control, name: 'categoryId' });
  const visibleCategories = categories.filter(
    category => category.type === type,
  );

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll>
      <AppHeader showBack title={title} />
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
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <AppInput
            error={errors.description?.message}
            label="Descrição"
            onChangeText={field.onChange}
            placeholder="Mercado"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <AppInput
            error={errors.amount?.message}
            keyboardType="number-pad"
            label="Valor"
            onChangeText={text => field.onChange(maskAmountInput(text))}
            placeholder="0,00"
            value={field.value}
          />
        )}
      />
      <AppText variant="label">Categoria</AppText>
      {visibleCategories.length === 0 ? (
        <AppText color="muted">Nenhuma categoria deste tipo.</AppText>
      ) : (
        <View style={styles.choices}>
          {visibleCategories.map(category => (
            <ChoiceChip
              key={category.id}
              label={category.name}
              onPress={() =>
                setValue('categoryId', category.id, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              selected={categoryId === category.id}
            />
          ))}
        </View>
      )}
      {errors.categoryId?.message ? (
        <AppText color="expense" variant="caption">
          {errors.categoryId.message}
        </AppText>
      ) : null}
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <AppInput
            autoCapitalize="none"
            error={errors.date?.message}
            label="Data"
            onChangeText={field.onChange}
            placeholder="AAAA-MM-DD"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <AppInput
            error={errors.notes?.message}
            label="Observações"
            multiline
            onChangeText={field.onChange}
            placeholder="Opcional"
            value={field.value}
          />
        )}
      />
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
    </ScreenContainer>
  );

  function selectType(next: AmountKind) {
    setValue('type', next, { shouldDirty: true, shouldValidate: true });
    const current = getValues('categoryId');
    const stillValid = categories.some(
      category => category.id === current && category.type === next,
    );

    if (!stillValid) {
      setValue('categoryId', '', { shouldDirty: true, shouldValidate: true });
    }
  }
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    choices: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });
}
