export function formatTransactionCount(count: number): string {
  if (count === 1) {
    return '1 lançamento';
  }

  if (count > 1) {
    return `${count} lançamentos`;
  }

  return 'Nenhum lançamento';
}
