import { isNonNegativeCents, isPositiveCents } from '@/lib/money';

const MAX_AMOUNT_DIGITS = 12;

export function formatAmountInput(amountCents: number): string {
  if (!isNonNegativeCents(amountCents)) {
    return '';
  }

  return groupAmountDigits(String(amountCents));
}

export function maskAmountInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, MAX_AMOUNT_DIGITS);

  if (digits === '') {
    return '';
  }

  const cents = Number(digits);

  if (!Number.isSafeInteger(cents)) {
    return '';
  }

  return groupAmountDigits(String(cents));
}

export function centsFromAmountInput(value: string): number | null {
  const digits = value.replace(/\D/g, '');

  if (digits === '') {
    return null;
  }

  const cents = Number(digits);

  return isPositiveCents(cents) ? cents : null;
}

function groupAmountDigits(digits: string): string {
  const padded = digits.padStart(3, '0');
  const whole = padded.slice(0, -2);
  const fraction = padded.slice(-2);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${grouped},${fraction}`;
}
