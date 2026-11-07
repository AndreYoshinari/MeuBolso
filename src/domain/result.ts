import type { FieldError } from '@/lib/errors';

export type ValidationSuccess<T> = {
  ok: true;
  value: T;
};

export type ValidationFailure = {
  ok: false;
  errors: FieldError[];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function success<T>(value: T): ValidationSuccess<T> {
  return { ok: true, value };
}

export function failure(errors: FieldError[]): ValidationFailure {
  return { ok: false, errors };
}
