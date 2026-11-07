import { formatTransactionCount } from '@/features/categories/presentation';

test('formats how many transactions use a category', () => {
  expect(formatTransactionCount(0)).toBe('Nenhum lançamento');
  expect(formatTransactionCount(1)).toBe('1 lançamento');
  expect(formatTransactionCount(3)).toBe('3 lançamentos');
});
