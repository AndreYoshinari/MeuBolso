import { budgetFormSchema, toBudgetInput } from '@/features/budgets/schema';

const valid = {
  categoryId: 'food',
  amount: '100,00',
  month: 3,
  year: 2026,
};

function issue(value: unknown): string | undefined {
  const parsed = budgetFormSchema.safeParse(value);

  return parsed.success ? undefined : parsed.error.issues[0]?.message;
}

test('rejects an empty category and a zero limit', () => {
  expect(issue({ ...valid, categoryId: '' })).toBe('Escolha uma categoria.');
  expect(issue({ ...valid, amount: '' })).toBe('Informe o valor.');
  expect(issue({ ...valid, amount: '0,00' })).toBe(
    'Informe um valor maior que zero.',
  );
});

test('stores the limit as cents', () => {
  expect(toBudgetInput(budgetFormSchema.parse(valid))).toEqual({
    categoryId: 'food',
    amountCents: 10_000,
    month: 3,
    year: 2026,
  });
});
