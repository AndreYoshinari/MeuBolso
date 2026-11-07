import { z } from 'zod';

import { centsFromAmountInput } from '@/lib/amount-input';
import { ValidationError } from '@/lib/errors';

export const budgetFormSchema = z.object({
  categoryId: z.string().trim().min(1, 'Escolha uma categoria.'),
  amount: z.string().superRefine((value, context) => {
    if (value.trim() === '') {
      context.addIssue({ code: 'custom', message: 'Informe o valor.' });
      return;
    }

    if (centsFromAmountInput(value) === null) {
      context.addIssue({
        code: 'custom',
        message: 'Informe um valor maior que zero.',
      });
    }
  }),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1).max(9999),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export type BudgetFormInput = {
  categoryId: string;
  amountCents: number;
  month: number;
  year: number;
};

export function toBudgetInput(values: BudgetFormValues): BudgetFormInput {
  const amountCents = centsFromAmountInput(values.amount);

  if (amountCents === null) {
    throw new ValidationError([
      {
        field: 'amount',
        message: 'Informe um valor maior que zero.',
      },
    ]);
  }

  return {
    categoryId: values.categoryId,
    amountCents,
    month: values.month,
    year: values.year,
  };
}
