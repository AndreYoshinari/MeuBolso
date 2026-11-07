import { createMemoryRepositories } from '@/domain/testing/memory-repositories';

export function createTestDeps() {
  let count = 0;

  return {
    ...createMemoryRepositories(),
    ids: () => `id-${++count}`,
    now: () => '2026-03-01T12:00:00.000Z',
  };
}
