import { isCivilDate, isUtcTimestamp } from '@/lib/period';
import { isPositiveCents } from '@/lib/money';

import { failure, success, type ValidationResult } from '@/domain/result';
import type {
  Budget,
  Category,
  Transaction,
  UserPreferences,
} from '@/domain/types';
import type { FieldError } from '@/lib/errors';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function validateCategory(input: unknown): ValidationResult<Category> {
  const record = asRecord(input);
  const errors: FieldError[] = [];

  if (!record) {
    return failure([{ field: 'category', message: 'Categoria inválida.' }]);
  }

  const id = readId(record, 'id', errors);
  const name = readRequiredText(
    record,
    'name',
    'Informe o nome da categoria.',
    errors,
  );
  const icon = readRequiredText(
    record,
    'icon',
    'Informe o ícone da categoria.',
    errors,
  );
  const color = readColor(record, errors);
  const type = readAmountType(record, errors);
  const isDefault = readBoolean(record, 'isDefault', errors);

  if (
    errors.length > 0 ||
    id === null ||
    name === null ||
    icon === null ||
    color === null ||
    type === null ||
    isDefault === null
  ) {
    return failure(errors);
  }

  return success({ id, name, icon, color, type, isDefault });
}

export function validateTransaction(
  input: unknown,
  categories: readonly Category[],
): ValidationResult<Transaction> {
  const record = asRecord(input);
  const errors: FieldError[] = [];

  if (!record) {
    return failure([{ field: 'transaction', message: 'Lançamento inválido.' }]);
  }

  const id = readId(record, 'id', errors);
  const description = readBoundedText(
    record,
    'description',
    'Informe a descrição.',
    80,
    'Use até 80 caracteres.',
    errors,
  );
  const amountCents = readPositiveCents(record, 'amountCents', errors);
  const type = readAmountType(record, errors);
  const categoryId = readId(record, 'categoryId', errors);
  const date = readCivilDate(record, errors);
  const notes = readNotes(record, errors);
  const createdAt = readTimestamp(record, 'createdAt', errors);
  const updatedAt = readTimestamp(record, 'updatedAt', errors);

  if (createdAt && updatedAt && updatedAt < createdAt) {
    errors.push({
      field: 'updatedAt',
      message: 'A atualização não pode ser anterior à criação.',
    });
  }

  if (categoryId && type) {
    assertMatchingCategory(categoryId, type, categories, errors);
  }

  if (
    errors.length > 0 ||
    id === null ||
    description === null ||
    amountCents === null ||
    type === null ||
    categoryId === null ||
    date === null ||
    notes === null ||
    createdAt === null ||
    updatedAt === null
  ) {
    return failure(errors);
  }

  return success({
    id,
    description,
    amountCents,
    type,
    categoryId,
    date,
    notes,
    createdAt,
    updatedAt,
  });
}

export function validateBudget(
  input: unknown,
  categories: readonly Category[],
  budgets: readonly Budget[] = [],
): ValidationResult<Budget> {
  const record = asRecord(input);
  const errors: FieldError[] = [];

  if (!record) {
    return failure([{ field: 'budget', message: 'Orçamento inválido.' }]);
  }

  const id = readId(record, 'id', errors);
  const categoryId = readId(record, 'categoryId', errors);
  const amountCents = readPositiveCents(record, 'amountCents', errors);
  const month = readMonth(record, errors);
  const year = readYear(record, errors);
  const createdAt = readTimestamp(record, 'createdAt', errors);
  const updatedAt = readTimestamp(record, 'updatedAt', errors);

  if (createdAt && updatedAt && updatedAt < createdAt) {
    errors.push({
      field: 'updatedAt',
      message: 'A atualização não pode ser anterior à criação.',
    });
  }

  if (categoryId) {
    assertExpenseCategory(categoryId, categories, errors);
  }

  if (id && categoryId && month !== null && year !== null) {
    const duplicate = budgets.some(
      budget =>
        budget.id !== id &&
        budget.categoryId === categoryId &&
        budget.month === month &&
        budget.year === year,
    );

    if (duplicate) {
      errors.push({
        field: 'categoryId',
        message: 'Já existe orçamento para esta categoria no período.',
      });
    }
  }

  if (
    errors.length > 0 ||
    id === null ||
    categoryId === null ||
    amountCents === null ||
    month === null ||
    year === null ||
    createdAt === null ||
    updatedAt === null
  ) {
    return failure(errors);
  }

  return success({
    id,
    categoryId,
    amountCents,
    month,
    year,
    createdAt,
    updatedAt,
  });
}

export function validateUserPreferences(
  input: unknown,
): ValidationResult<UserPreferences> {
  const record = asRecord(input);
  const errors: FieldError[] = [];

  if (!record) {
    return failure([
      { field: 'preferences', message: 'Preferências inválidas.' },
    ]);
  }

  const currency = record.currency;
  const theme = record.theme;
  const displayName = readDisplayName(record, errors);
  const notificationsEnabled = readBoolean(
    record,
    'notificationsEnabled',
    errors,
  );
  const onboardingCompleted = readBoolean(
    record,
    'onboardingCompleted',
    errors,
  );
  const reminderDay = readBoundedInteger(
    record,
    'reminderDay',
    1,
    28,
    'Escolha um dia entre 1 e 28.',
    errors,
  );
  const reminderHour = readBoundedInteger(
    record,
    'reminderHour',
    0,
    23,
    'Escolha uma hora entre 0 e 23.',
    errors,
  );

  if (currency !== 'BRL') {
    errors.push({
      field: 'currency',
      message: 'A moeda do razão é o real.',
    });
  }

  if (theme !== 'dark' && theme !== 'light') {
    errors.push({
      field: 'theme',
      message: 'O tema deve ser escuro ou claro.',
    });
  }

  if (
    errors.length > 0 ||
    displayName === null ||
    currency !== 'BRL' ||
    (theme !== 'dark' && theme !== 'light') ||
    notificationsEnabled === null ||
    onboardingCompleted === null ||
    reminderDay === null ||
    reminderHour === null
  ) {
    return failure(errors);
  }

  return success({
    displayName,
    currency,
    theme,
    notificationsEnabled,
    reminderDay,
    reminderHour,
    onboardingCompleted,
  });
}

function assertMatchingCategory(
  categoryId: string,
  type: Transaction['type'],
  categories: readonly Category[],
  errors: FieldError[],
) {
  const category = findValidCategory(categories, categoryId);

  if (!category) {
    errors.push({
      field: 'categoryId',
      message: 'A categoria do lançamento é inválida.',
    });
    return;
  }

  if (category.type !== type) {
    errors.push({
      field: 'categoryId',
      message: 'A categoria precisa ser do mesmo tipo do lançamento.',
    });
  }
}

function assertExpenseCategory(
  categoryId: string,
  categories: readonly Category[],
  errors: FieldError[],
) {
  const category = findValidCategory(categories, categoryId);

  if (!category) {
    errors.push({
      field: 'categoryId',
      message: 'A categoria do orçamento é inválida.',
    });
    return;
  }

  if (category.type !== 'expense') {
    errors.push({
      field: 'categoryId',
      message: 'Orçamento só vale para categoria de despesa.',
    });
  }
}

function findValidCategory(
  categories: readonly Category[],
  categoryId: string,
): Category | null {
  const category = categories.find(item => item.id === categoryId);

  if (!category) {
    return null;
  }

  const result = validateCategory(category);

  return result.ok ? result.value : null;
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null;
  }

  return input as Record<string, unknown>;
}

function readId(
  record: Record<string, unknown>,
  field: string,
  errors: FieldError[],
): string | null {
  const value = record[field];

  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    value !== value.trim()
  ) {
    errors.push({ field, message: 'Informe um identificador.' });
    return null;
  }

  return value;
}

function readRequiredText(
  record: Record<string, unknown>,
  field: string,
  message: string,
  errors: FieldError[],
): string | null {
  const value = record[field];

  if (typeof value !== 'string' || value.trim() === '') {
    errors.push({ field, message });
    return null;
  }

  return value;
}

function readColor(
  record: Record<string, unknown>,
  errors: FieldError[],
): string | null {
  const value = record.color;

  if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
    errors.push({ field: 'color', message: 'Informe uma cor hexadecimal.' });
    return null;
  }

  return value;
}

function readAmountType(
  record: Record<string, unknown>,
  errors: FieldError[],
): Transaction['type'] | null {
  if (record.type !== 'income' && record.type !== 'expense') {
    errors.push({
      field: 'type',
      message: 'O tipo deve ser receita ou despesa.',
    });
    return null;
  }

  return record.type;
}

function readPositiveCents(
  record: Record<string, unknown>,
  field: string,
  errors: FieldError[],
): number | null {
  if (!isPositiveCents(record[field])) {
    errors.push({
      field,
      message: 'Informe um valor inteiro maior que zero, em centavos.',
    });
    return null;
  }

  return record[field];
}

function readCivilDate(
  record: Record<string, unknown>,
  errors: FieldError[],
): string | null {
  const value = record.date;

  if (typeof value !== 'string' || !isCivilDate(value)) {
    errors.push({
      field: 'date',
      message: 'Informe a data no formato AAAA-MM-DD.',
    });
    return null;
  }

  return value;
}

function readBoundedText(
  record: Record<string, unknown>,
  field: string,
  emptyMessage: string,
  maxLength: number,
  lengthMessage: string,
  errors: FieldError[],
): string | null {
  const value = record[field];

  if (typeof value !== 'string') {
    errors.push({ field, message: emptyMessage });
    return null;
  }

  const text = value.trim();

  if (text === '') {
    errors.push({ field, message: emptyMessage });
    return null;
  }

  if (text.length > maxLength) {
    errors.push({ field, message: lengthMessage });
    return null;
  }

  return text;
}

function readNotes(
  record: Record<string, unknown>,
  errors: FieldError[],
): string | null {
  if (typeof record.notes !== 'string') {
    errors.push({ field: 'notes', message: 'As observações são inválidas.' });
    return null;
  }

  const notes = record.notes.trim();

  if (notes.length > 280) {
    errors.push({ field: 'notes', message: 'Use até 280 caracteres.' });
    return null;
  }

  return notes;
}

function readTimestamp(
  record: Record<string, unknown>,
  field: string,
  errors: FieldError[],
): string | null {
  const value = record[field];

  if (typeof value !== 'string' || !isUtcTimestamp(value)) {
    errors.push({
      field,
      message: 'Informe a data e hora em UTC.',
    });
    return null;
  }

  return value;
}

function readMonth(
  record: Record<string, unknown>,
  errors: FieldError[],
): number | null {
  const month = record.month;

  if (
    typeof month !== 'number' ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    errors.push({ field: 'month', message: 'Informe um mês entre 1 e 12.' });
    return null;
  }

  return month;
}

function readYear(
  record: Record<string, unknown>,
  errors: FieldError[],
): number | null {
  const year = record.year;

  if (
    typeof year !== 'number' ||
    !Number.isInteger(year) ||
    year < 1 ||
    year > 9999
  ) {
    errors.push({ field: 'year', message: 'Informe um ano válido.' });
    return null;
  }

  return year;
}

function readDisplayName(
  record: Record<string, unknown>,
  errors: FieldError[],
): string | null {
  if (typeof record.displayName !== 'string') {
    errors.push({
      field: 'displayName',
      message: 'Informe o nome de exibição.',
    });
    return null;
  }

  const name = record.displayName.trim();

  if (name.length > 40) {
    errors.push({
      field: 'displayName',
      message: 'Use no máximo 40 caracteres.',
    });
    return null;
  }

  return name;
}

function readBoundedInteger(
  record: Record<string, unknown>,
  field: string,
  min: number,
  max: number,
  message: string,
  errors: FieldError[],
): number | null {
  const value = record[field];

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    errors.push({ field, message });
    return null;
  }

  return value;
}

function readBoolean(
  record: Record<string, unknown>,
  field: string,
  errors: FieldError[],
): boolean | null {
  const value = record[field];

  if (typeof value !== 'boolean') {
    errors.push({ field, message: 'Informe um valor verdadeiro ou falso.' });
    return null;
  }

  return value;
}
