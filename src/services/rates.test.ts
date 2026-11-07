import { NetworkError, ValidationError } from '@/lib/errors';

import { createMemoryRepositories } from '@/domain/testing/memory-repositories';
import {
  historicalRateFixture,
  latestRateFixture,
  currenciesFixture,
} from '@/services/frankfurter-schema';
import {
  loadCurrencies,
  loadRateQuote,
  readStoredQuote,
  type RatesFetcher,
} from '@/services/rates';

const fetchedAt = '2026-11-06T15:00:00.000Z';

function jsonResponse(body: string, status = 200): RatesFetcher {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  });
}

test('reads currencies and keeps the rate decimal from the Frankfurter payload', async () => {
  const repositories = createMemoryRepositories();
  const calls: string[] = [];
  const fetchImpl: RatesFetcher = async url => {
    calls.push(url);

    if (url.endsWith('/v2/currencies')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(currenciesFixture),
      };
    }

    return {
      ok: true,
      status: 200,
      text: async () => latestRateFixture,
    };
  };

  await expect(loadCurrencies({ fetchImpl })).resolves.toEqual([
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'USD', name: 'United States Dollar' },
  ]);

  const result = await loadRateQuote({
    base: 'usd',
    quote: 'brl',
    rates: repositories.rates,
    fetchImpl,
    now: () => fetchedAt,
  });

  expect(result).toEqual({
    origin: 'network',
    quote: {
      base: 'USD',
      quote: 'BRL',
      rate: '5.4856',
      quotedOn: '2026-11-06',
      fetchedAt,
    },
  });
  expect(calls.some(url => url.endsWith('/v2/rate/usd/brl'))).toBe(true);
  expect(await repositories.rates.list()).toEqual([result.quote]);
});

test('requests a historical date and does not replace it with another cached day', async () => {
  const repositories = createMemoryRepositories();
  await repositories.rates.saveAll([
    {
      base: 'USD',
      quote: 'BRL',
      rate: '5.4856',
      quotedOn: '2026-11-06',
      fetchedAt,
    },
  ]);
  const calls: string[] = [];

  const result = await loadRateQuote({
    base: 'USD',
    quote: 'BRL',
    date: '2024-01-02',
    rates: repositories.rates,
    now: () => fetchedAt,
    fetchImpl: async url => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        text: async () => historicalRateFixture,
      };
    },
  });

  expect(calls[0]).toContain('/v2/rate/usd/brl?date=2024-01-02');
  expect(result.quote).toMatchObject({ rate: '4.871', quotedOn: '2024-01-02' });

  await expect(
    loadRateQuote({
      base: 'USD',
      quote: 'BRL',
      date: '2024-01-02',
      rates: repositories.rates,
      fetchImpl: async () => {
        throw new Error('offline');
      },
    }),
  ).resolves.toMatchObject({
    origin: 'cache',
    quote: { rate: '4.871', quotedOn: '2024-01-02' },
  });

  await expect(
    loadRateQuote({
      base: 'USD',
      quote: 'BRL',
      date: '1999-01-04',
      rates: repositories.rates,
      fetchImpl: async () => {
        throw new Error('offline');
      },
    }),
  ).rejects.toBeInstanceOf(NetworkError);
  expect((await repositories.rates.list())[0]?.quotedOn).toBe('2024-01-02');
});

test('shows the saved quote when the latest request fails and rejects an invalid payload', async () => {
  const repositories = createMemoryRepositories();
  const saved = {
    base: 'USD',
    quote: 'BRL',
    rate: '5.4856',
    quotedOn: '2026-11-06',
    fetchedAt,
  };
  await repositories.rates.saveAll([saved]);

  await expect(
    loadRateQuote({
      base: 'USD',
      quote: 'BRL',
      rates: repositories.rates,
      fetchImpl: async () => {
        throw new Error('offline');
      },
    }),
  ).resolves.toEqual({ origin: 'cache', quote: saved });

  const empty = createMemoryRepositories();

  await expect(
    loadRateQuote({
      base: 'USD',
      quote: 'BRL',
      rates: empty.rates,
      fetchImpl: jsonResponse(
        '{"date":"2026-11-06","base":"USD","quote":"BRL","rate":"abc"}',
      ),
    }),
  ).rejects.toBeInstanceOf(ValidationError);
  expect(await empty.rates.list()).toEqual([]);

  await expect(
    loadRateQuote({
      base: 'USD',
      quote: 'BRL',
      rates: empty.rates,
      fetchImpl: jsonResponse('{"status":404,"message":"not found"}', 404),
    }),
  ).rejects.toThrow('Não há cotação para esta data ou este par.');
});

test('stops a slow request and does not invent a rate', async () => {
  const repositories = createMemoryRepositories();

  await expect(
    loadRateQuote({
      base: 'USD',
      quote: 'BRL',
      rates: repositories.rates,
      timeoutMs: 20,
      fetchImpl: (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        }),
    }),
  ).rejects.toThrow('A consulta da cotação demorou demais.');
  expect(await repositories.rates.list()).toEqual([]);
});

test('reads a stored quote without contacting the network', async () => {
  const repositories = createMemoryRepositories();
  const saved = {
    base: 'USD',
    quote: 'BRL',
    rate: '5.4856',
    quotedOn: '2026-11-06',
    fetchedAt,
  };
  await repositories.rates.saveAll([saved]);

  await expect(
    readStoredQuote({
      base: 'usd',
      quote: 'brl',
      rates: repositories.rates,
    }),
  ).resolves.toEqual(saved);
});

test('does not call the API when the two currencies are the same', async () => {
  const fetchImpl = jest.fn();

  await expect(
    loadRateQuote({ base: 'USD', quote: 'usd', fetchImpl }),
  ).rejects.toThrow('Escolha duas moedas diferentes.');
  expect(fetchImpl).not.toHaveBeenCalled();
});
