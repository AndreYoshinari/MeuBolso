import {
  toTransactionInput,
  transactionFormSchema,
} from '@/features/transactions/schema';

const valid = {
  description: ' Mercado ',
  amount: '12,50',
  type: 'expense',
  categoryId: 'food',
  date: '2026-11-06',
  notes: ' semana ',
};

function issue(value: unknown): string | undefined {
  const parsed = transactionFormSchema.safeParse(value);

  return parsed.success ? undefined : parsed.error.issues[0]?.message;
}

test('rejects an empty description, a zero amount and a bad date', () => {
  expect(issue({ ...valid, description: '   ' })).toBe('Informe a descrição.');
  expect(issue({ ...valid, amount: '' })).toBe('Informe o valor.');
  expect(issue({ ...valid, amount: '0,00' })).toBe(
    'Informe um valor maior que zero.',
  );
  expect(issue({ ...valid, date: '06/11/2026' })).toBe(
    'Informe a data no formato AAAA-MM-DD.',
  );
  expect(issue({ ...valid, categoryId: '' })).toBe('Escolha uma categoria.');
});

test('stores the form amount as cents', () => {
  const parsed = transactionFormSchema.parse(valid);

  expect(parsed.description).toBe('Mercado');
  expect(parsed.notes).toBe('semana');
  expect(toTransactionInput(parsed)).toEqual({
    description: 'Mercado',
    amountCents: 1250,
    type: 'expense',
    categoryId: 'food',
    date: '2026-11-06',
    notes: 'semana',
  });
});
