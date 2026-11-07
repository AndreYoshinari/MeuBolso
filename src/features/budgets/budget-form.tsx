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
import { PeriodStepper } from '@/features/budgets/period-stepper';
import {
  budgetFormSchema,
  type BudgetFormValues,
} from '@/features/budgets/schema';
import { ChoiceChip } from '@/features/navigation/widgets';
import { maskAmountInput } from '@/lib/amount-input';
import type { AmountKind } from '@/lib/money';
import { useTheme, type Theme } from '@/theme';

type FormCategory = {
  id: string;
  name: string;
  type: AmountKind;
};

type BudgetFormProps = {
  title: string;
  categories: readonly FormCategory[];
  defaultValues: BudgetFormValues;
  errorMessage: string | null;
  isPending: boolean;
  onSubmit: (values: BudgetFormValues) => Promise<void>;
  onDelete?: () => void;
  deletePending?: boolean;
};

export function BudgetForm({
  title,
  categories,
  defaultValues,
  errorMessage,
  isPending,
  onSubmit,
  onDelete,
  deletePending = false,
}: BudgetFormProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues,
  });
  const month = useWatch({ control, name: 'month' });
  const year = useWatch({ control, name: 'year' });
  const categoryId = useWatch({ control, name: 'categoryId' });
  const expenseCategories = categories.filter(
    category => category.type === 'expense',
  );

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll>
      <AppHeader showBack title={title} />
      <PeriodStepper
        onChange={period => {
          setValue('year', period.year, {
            shouldDirty: true,
            shouldValidate: true,
          });
          setValue('month', period.month, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
        period={{ year, month }}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <AppInput
            error={errors.amount?.message}
            keyboardType="number-pad"
            label="Limite"
            onChangeText={text => field.onChange(maskAmountInput(text))}
            placeholder="0,00"
            value={field.value}
          />
        )}
      />
      <AppText variant="label">Categoria</AppText>
      {expenseCategories.length === 0 ? (
        <AppText color="muted">Nenhuma categoria de despesa.</AppText>
      ) : (
        <View style={styles.choices}>
          {expenseCategories.map(category => (
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
      {errorMessage ? <AppText color="expense">{errorMessage}</AppText> : null}
      <AppButton
        label="Salvar"
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
