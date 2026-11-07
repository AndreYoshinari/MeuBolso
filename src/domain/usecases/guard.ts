import { NotFoundError, ValidationError } from '@/lib/errors';
import { isYearMonth, type YearMonth } from '@/lib/period';

import type { ValidationResult } from '@/domain/result';

export function unwrap<T>(result: ValidationResult<T>): T {
  if (!result.ok) {
    throw new ValidationError(result.errors);
  }

  return result.value;
}

export function unwrapFound<T>(value: T | null, message: string): T {
  if (!value) {
    throw new NotFoundError(message);
  }

  return value;
}

export function requirePeriod(period: unknown): YearMonth {
  if (!isYearMonth(period)) {
    throw new ValidationError([
      { field: 'period', message: 'Informe um mês e um ano válidos.' },
    ]);
  }

  return period;
}
