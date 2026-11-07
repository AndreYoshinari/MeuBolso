import { z } from 'zod';

import { centsFromAmountInput } from '@/lib/amount-input';
import { ValidationError } from '@/lib/errors';
import type { AmountKind } from '@/lib/money';
import { isCivilDate } from '@/lib/period';

export const transactionFormSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Informe a descrição.')
    .max(80, 'Use até 80 caracteres.'),
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
  type: z.enum(['income', 'expense'], 'Escolha o tipo.'),
  categoryId: z.string().trim().min(1, 'Escolha uma categoria.'),
  date: z
    .string()
    .trim()
    .refine(isCivilDate, 'Informe a data no formato AAAA-MM-DD.'),
  notes: z.string().trim().max(280, 'Use até 280 caracteres.'),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export type TransactionFormInput = {
  description: string;
  amountCents: number;
  type: AmountKind;
  categoryId: string;
  date: string;
  notes: string;
};

export function toTransactionInput(
  values: TransactionFormValues,
): TransactionFormInput {
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
    description: values.description,
    amountCents,
    type: values.type,
    categoryId: values.categoryId,
    date: values.date,
    notes: values.notes,
  };
}
