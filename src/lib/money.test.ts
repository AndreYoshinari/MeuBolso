import { ValidationError } from '@/lib/errors';
import {
  addCents,
  addSignedCents,
  formatCurrency,
  formatSignedCurrency,
  isPositiveCents,
  resolveDisplayCents,
  subtractCents,
  toBasisPoints,
} from '@/lib/money';

function normalize(value: string) {
  return value.replace(/\u00a0/g, ' ');
}

test('formats cents as BRL', () => {
  expect(normalize(formatCurrency(123456))).toBe('R$ 1.234,56');
  expect(normalize(formatCurrency(0))).toBe('R$ 0,00');
});

test('adds an explicit sign without doubling the minus', () => {
  expect(normalize(formatSignedCurrency(850000))).toBe('+R$ 8.500,00');
  expect(normalize(formatSignedCurrency(-18690))).toBe('-R$ 186,90');
  expect(normalize(formatSignedCurrency(0))).toBe('R$ 0,00');
});

test('adds signed cent amounts without losing the sign', () => {
  expect(addSignedCents(100, -40)).toBe(60);
  expect(addSignedCents(-20, -30)).toBe(-50);
  expect(addSignedCents(0, 0)).toBe(0);
  expect(() => addSignedCents(1.5, 1)).toThrow(ValidationError);
});

test('accepts only positive integer cents', () => {
  expect(isPositiveCents(1)).toBe(true);
  expect(isPositiveCents(0)).toBe(false);
  expect(isPositiveCents(-1)).toBe(false);
  expect(isPositiveCents(10.5)).toBe(false);
});

test('adds and subtracts cents as integers', () => {
  expect(addCents([10, 20])).toBe(30);
  expect(subtractCents(20, 50)).toBe(-30);
  expect(() => addCents([10.5])).toThrow(ValidationError);
  expect(() => addCents([Number.MAX_SAFE_INTEGER, 1])).toThrow(ValidationError);
});

test('calculates basis points with integer rounding', () => {
  expect(toBasisPoints(1, 3)).toBe(3333);
  expect(toBasisPoints(2, 3)).toBe(6667);
  expect(toBasisPoints(1, 2)).toBe(5000);
  expect(toBasisPoints(10, 0)).toBeNull();
});

test('resolves the display sign from the transaction kind', () => {
  expect(resolveDisplayCents(18690, 'expense')).toBe(-18690);
  expect(resolveDisplayCents(850000, 'income')).toBe(850000);
  expect(resolveDisplayCents(-1200)).toBe(-1200);
});
