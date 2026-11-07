import { claimSubmit, releaseSubmit } from '@/lib/submit-guard';

test('ignores a second submit until the first one finishes', () => {
  const guard = { current: false };

  expect(claimSubmit(guard)).toBe(true);
  expect(claimSubmit(guard)).toBe(false);
  releaseSubmit(guard);
  expect(claimSubmit(guard)).toBe(true);
});
