import {
  centsFromAmountInput,
  formatAmountInput,
  maskAmountInput,
} from '@/lib/amount-input';

test('formats cents with Brazilian grouping', () => {
  expect(formatAmountInput(0)).toBe('0,00');
  expect(formatAmountInput(50)).toBe('0,50');
  expect(formatAmountInput(1250)).toBe('12,50');
  expect(formatAmountInput(123456)).toBe('1.234,56');
});

test('masks typed digits as cents', () => {
  expect(maskAmountInput('')).toBe('');
  expect(maskAmountInput('1250')).toBe('12,50');
  expect(maskAmountInput('050')).toBe('0,50');
  expect(maskAmountInput('000')).toBe('0,00');
  expect(maskAmountInput('12a50')).toBe('12,50');
  expect(maskAmountInput('1.234,56')).toBe('1.234,56');
});

test('reads a positive cent amount from the masked field', () => {
  expect(centsFromAmountInput('')).toBeNull();
  expect(centsFromAmountInput('0,00')).toBeNull();
  expect(centsFromAmountInput('0,50')).toBe(50);
  expect(centsFromAmountInput('12,50')).toBe(1250);
  expect(centsFromAmountInput('1.234,56')).toBe(123456);
});
