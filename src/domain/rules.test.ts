import {
  validateBudget,
  validateCategory,
  validateTransaction,
  validateUserPreferences,
  type Budget,
  type Category,
  type Transaction,
} from '@/domain';

const createdAt = '2026-03-01T12:00:00.000Z';
const updatedAt = '2026-03-02T12:00:00.000Z';

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 'food',
    name: 'Alimentação',
    icon: 'expense',
    color: '#FF6B7A',
    type: 'expense',
    isDefault: true,
    ...overrides,
  };
}

function incomeCategory(): Category {
  return category({
    id: 'salary',
    name: 'Salário',
    icon: 'income',
    color: '#3DDC97',
    type: 'income',
    isDefault: true,
  });
}

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Mercado',
    amountCents: 18690,
    type: 'expense',
    categoryId: 'food',
    date: '2026-03-01',
    notes: '',
    createdAt,
    updatedAt,
    ...overrides,
  };
}

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-1',
    categoryId: 'food',
    amountCents: 50000,
    month: 3,
    year: 2026,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

test('accepts a valid expense and a valid income', () => {
  const food = category();
  const salary = incomeCategory();

  expect(validateTransaction(transaction(), [food, salary]).ok).toBe(true);
  expect(
    validateTransaction(
      transaction({
        id: 'tx-2',
        description: 'Salário',
        amountCents: 850000,
        type: 'income',
        categoryId: 'salary',
      }),
      [food, salary],
    ).ok,
  ).toBe(true);
});

test('rejects zero and negative amounts for expense and income', () => {
  const categories = [category(), incomeCategory()];

  for (const type of ['expense', 'income'] as const) {
    const categoryId = type === 'expense' ? 'food' : 'salary';

    for (const amountCents of [0, -1]) {
      const result = validateTransaction(
        transaction({ type, categoryId, amountCents }),
        categories,
      );

      expect(result.ok).toBe(false);

      if (!result.ok) {
        expect(result.errors.map(error => error.field)).toContain(
          'amountCents',
        );
      }
    }
  }
});

test('rejects a blank description and notes that are not text', () => {
  const blank = validateTransaction(transaction({ description: '   ' }), [
    category(),
  ]);
  const notes = validateTransaction(
    transaction({ notes: 1 as unknown as string }),
    [category()],
  );

  expect(blank.ok).toBe(false);
  expect(notes.ok).toBe(false);

  if (!blank.ok) {
    expect(blank.errors[0]?.message).toBe('Informe a descrição.');
  }

  if (!notes.ok) {
    expect(notes.errors.map(error => error.field)).toContain('notes');
  }
});

test('trims the description and rejects text past the form limits', () => {
  const trimmed = validateTransaction(
    transaction({ description: '  Mercado  ', notes: '  feira  ' }),
    [category()],
  );
  const longDescription = validateTransaction(
    transaction({ description: 'a'.repeat(81) }),
    [category()],
  );
  const longNotes = validateTransaction(
    transaction({ notes: 'a'.repeat(281) }),
    [category()],
  );
  const impossibleDay = validateTransaction(
    transaction({ date: '2026-02-31' }),
    [category()],
  );

  expect(trimmed.ok).toBe(true);

  if (trimmed.ok) {
    expect(trimmed.value.description).toBe('Mercado');
    expect(trimmed.value.notes).toBe('feira');
  }

  expect(longDescription.ok).toBe(false);
  expect(longNotes.ok).toBe(false);
  expect(impossibleDay.ok).toBe(false);

  if (!longDescription.ok) {
    expect(longDescription.errors[0]?.message).toBe('Use até 80 caracteres.');
  }

  if (!longNotes.ok) {
    expect(longNotes.errors.map(error => error.field)).toContain('notes');
  }

  if (!impossibleDay.ok) {
    expect(impossibleDay.errors.map(error => error.field)).toContain('date');
  }
});

test('rejects fractional cents', () => {
  const result = validateTransaction(transaction({ amountCents: 10.5 }), [
    category(),
  ]);

  expect(result.ok).toBe(false);
});

test('rejects a missing or mismatched category', () => {
  const missing = validateTransaction(transaction({ categoryId: 'missing' }), [
    category(),
  ]);
  const mismatched = validateTransaction(
    transaction({ type: 'income', categoryId: 'food' }),
    [category()],
  );

  expect(missing.ok).toBe(false);
  expect(mismatched.ok).toBe(false);

  if (!mismatched.ok) {
    expect(mismatched.errors[0]?.message).toBe(
      'A categoria precisa ser do mesmo tipo do lançamento.',
    );
  }
});

test('rejects a date that is not a civil day', () => {
  const result = validateTransaction(
    transaction({ date: '2026-03-01T00:00:00.000Z' }),
    [category()],
  );

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.errors.map(error => error.field)).toContain('date');
  }
});

test('rejects an invalid category and a budget without period or positive amount', () => {
  expect(validateCategory(category({ name: '   ' })).ok).toBe(false);
  expect(validateCategory(category({ color: 'green' })).ok).toBe(false);

  const withoutAmount = validateBudget(budget({ amountCents: 0 }), [
    category(),
  ]);
  const withoutMonth = validateBudget(budget({ month: 0 }), [category()]);
  const incomeBudget = validateBudget(budget({ categoryId: 'salary' }), [
    incomeCategory(),
  ]);

  expect(withoutAmount.ok).toBe(false);
  expect(withoutMonth.ok).toBe(false);
  expect(incomeBudget.ok).toBe(false);

  if (!incomeBudget.ok) {
    expect(incomeBudget.errors[0]?.message).toBe(
      'Orçamento só vale para categoria de despesa.',
    );
  }
});

test('rejects a second budget for the same category and period', () => {
  const existing = budget();
  const result = validateBudget(
    budget({ id: 'budget-2' }),
    [category()],
    [existing],
  );

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.errors[0]?.message).toBe(
      'Já existe orçamento para esta categoria no período.',
    );
  }
});

test('accepts preferences and rejects another currency', () => {
  expect(
    validateUserPreferences({
      displayName: 'Ana',
      currency: 'BRL',
      theme: 'dark',
      notificationsEnabled: true,
      reminderDay: 5,
      reminderHour: 9,
      onboardingCompleted: false,
    }).ok,
  ).toBe(true);

  const result = validateUserPreferences({
    displayName: 'Ana',
    currency: 'USD',
    theme: 'system',
    notificationsEnabled: true,
    reminderDay: 5,
    reminderHour: 9,
    onboardingCompleted: false,
  });

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.errors.map(error => error.field)).toEqual([
      'currency',
      'theme',
    ]);
  }
});

test('rejects a long display name and a reminder outside the month', () => {
  const result = validateUserPreferences({
    displayName: 'a'.repeat(41),
    currency: 'BRL',
    theme: 'dark',
    notificationsEnabled: false,
    reminderDay: 31,
    reminderHour: 24,
    onboardingCompleted: false,
  });

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.errors.map(error => error.field)).toEqual([
      'displayName',
      'reminderDay',
      'reminderHour',
    ]);
  }
});
