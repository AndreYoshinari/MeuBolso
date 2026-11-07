export function formatShare(basisPoints: number | null): string {
  if (basisPoints === null) {
    return '0%';
  }

  const whole = Math.floor(basisPoints / 100);
  const fraction = basisPoints % 100;

  if (fraction === 0) {
    return `${whole}%`;
  }

  return `${whole},${String(fraction).padStart(2, '0')}%`;
}
