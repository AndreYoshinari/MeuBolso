import { onlineManager } from '@tanstack/react-query';

import { ValidationError } from '@/lib/errors';
import { createAppQueryClient } from '@/providers/query-client';

function localQuery<T>(queryKey: readonly string[], queryFn: () => Promise<T>) {
  return {
    queryKey,
    queryFn,
    gcTime: 0,
    retryDelay: 0,
  };
}

afterEach(() => {
  onlineManager.setOnline(true);
});

test('reads local data while the device is offline', async () => {
  onlineManager.setOnline(false);
  const client = createAppQueryClient();

  try {
    await expect(
      client.fetchQuery(localQuery(['ledger', 'offline'], async () => 'local')),
    ).resolves.toBe('local');
  } finally {
    client.clear();
  }
});

test('does not retry a validation error and retries other local failures once', async () => {
  const client = createAppQueryClient();
  let invalidAttempts = 0;
  let failedAttempts = 0;

  try {
    await expect(
      client.fetchQuery(
        localQuery(['period', 'invalid'], async () => {
          invalidAttempts += 1;
          throw new ValidationError([
            { field: 'period', message: 'Informe um mês e um ano válidos.' },
          ]);
        }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      client.fetchQuery(
        localQuery(['ledger', 'fail'], async () => {
          failedAttempts += 1;
          throw new Error('falha');
        }),
      ),
    ).rejects.toThrow('falha');
  } finally {
    client.clear();
  }

  expect(invalidAttempts).toBe(1);
  expect(failedAttempts).toBe(2);
});
