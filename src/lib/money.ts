import { ValidationError } from '@/lib/errors';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export type AmountKind = 'income' | 'expense';

export function formatCurrency(amountCents: number): string {
  return currencyFormatter.format(amountCents / 100);
}

export function resolveDisplayCents(
  amountCents: number,
  kind?: AmountKind,
): number {
  if (kind === 'expense') {
    return -Math.abs(amountCents);
  }

  if (kind === 'income') {
    return Math.abs(amountCents);
  }

  return amountCents;
}

export function isPositiveCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

export function isNonNegativeCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function addCents(values: readonly number[]): number {
  return values.reduce((total, value) => {
    if (!isNonNegativeCents(value)) {
      throw new ValidationError([
        {
          field: 'amountCents',
          message: 'Valor em centavos inválido.',
        },
      ]);
    }

    const next = total + value;

    if (!Number.isSafeInteger(next)) {
      throw new ValidationError([
        {
          field: 'amountCents',
          message: 'Soma excede o limite seguro.',
        },
      ]);
    }

    return next;
  }, 0);
}

export function subtractCents(minuend: number, subtrahend: number): number {
  if (!isNonNegativeCents(minuend) || !isNonNegativeCents(subtrahend)) {
    throw new ValidationError([
      {
        field: 'amountCents',
        message: 'Valor em centavos inválido.',
      },
    ]);
  }

  const result = minuend - subtrahend;

  if (!Number.isSafeInteger(result)) {
    throw new ValidationError([
      {
        field: 'amountCents',
        message: 'Resultado excede o limite seguro.',
      },
    ]);
  }

  return result;
}

export function addSignedCents(left: number, right: number): number {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right)) {
    throw new ValidationError([
      {
        field: 'amountCents',
        message: 'Valor em centavos inválido.',
      },
    ]);
  }

  const result = left + right;

  if (!Number.isSafeInteger(result)) {
    throw new ValidationError([
      {
        field: 'amountCents',
        message: 'Soma excede o limite seguro.',
      },
    ]);
  }

  return result;
}

// Base 10_000 evita fração binária. 10_000 representa 100%.
export function toBasisPoints(
  partCents: number,
  totalCents: number,
): number | null {
  if (!isNonNegativeCents(partCents)) {
    throw new ValidationError([
      {
        field: 'amountCents',
        message: 'Valor em centavos inválido.',
      },
    ]);
  }

  if (!isPositiveCents(totalCents)) {
    return null;
  }

  const product = partCents * 10_000;

  if (!Number.isSafeInteger(product)) {
    throw new ValidationError([
      {
        field: 'amountCents',
        message: 'Percentual excede o limite seguro.',
      },
    ]);
  }

  return Math.floor((product + Math.floor(totalCents / 2)) / totalCents);
}

export function formatSignedCurrency(amountCents: number): string {
  const formatted = formatCurrency(Math.abs(amountCents));

  if (amountCents > 0) {
    return `+${formatted}`;
  }

  if (amountCents < 0) {
    return `-${formatted}`;
  }

  return formatted;
}
