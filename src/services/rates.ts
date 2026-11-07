import type { ExchangeRate } from '@/domain/types';
import type { ExchangeRateRepository } from '@/domain/repositories';
import { NetworkError, ValidationError } from '@/lib/errors';
import { isCivilDate } from '@/lib/period';
import {
  parseCurrencies,
  parseRateQuote,
  type CurrencyOption,
} from '@/services/frankfurter-schema';

const TIMEOUT_MS = 8000;

export type QuoteOrigin = 'network' | 'cache';

export type RateQuoteResult = {
  quote: ExchangeRate;
  origin: QuoteOrigin;
};

export type RatesFetcher = (
  url: string,
  init?: { signal?: AbortSignal },
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

type ClientDeps = {
  fetchImpl?: RatesFetcher;
  timeoutMs?: number;
};

type QuoteDeps = ClientDeps & {
  base: string;
  quote: string;
  date?: string | null;
  rates?: ExchangeRateRepository;
  now?: () => string;
};

export async function loadCurrencies(
  deps: ClientDeps = {},
): Promise<CurrencyOption[]> {
  const body = await request(
    `${apiUrl()}/v2/currencies`,
    deps.fetchImpl ?? fetch,
    deps.timeoutMs ?? TIMEOUT_MS,
  );

  try {
    return parseCurrencies(JSON.parse(body) as unknown);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError([
      {
        field: 'currencies',
        message: 'A lista de moedas recebida é inválida.',
      },
    ]);
  }
}

export async function loadRateQuote(deps: QuoteDeps): Promise<RateQuoteResult> {
  const base = deps.base.trim().toUpperCase();
  const quote = deps.quote.trim().toUpperCase();
  const date = deps.date?.trim() ? deps.date.trim() : null;

  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote) || base === quote) {
    throw new ValidationError([
      { field: 'pair', message: 'Escolha duas moedas diferentes.' },
    ]);
  }

  if (date && !isCivilDate(date)) {
    throw new ValidationError([
      { field: 'date', message: 'Informe uma data válida.' },
    ]);
  }

  const repository = deps.rates ?? (await defaultRates());
  const fetchedAt = deps.now?.() ?? new Date().toISOString();
  const stored = await cachedQuote(repository, base, quote, date);

  try {
    const body = await request(
      rateUrl(base, quote, date),
      deps.fetchImpl ?? fetch,
      deps.timeoutMs ?? TIMEOUT_MS,
    );
    const parsed = parseRateQuote(body);
    const fresh: ExchangeRate = { ...parsed, fetchedAt };
    await repository.saveAll([fresh]);

    return { quote: fresh, origin: 'network' };
  } catch (error) {
    console.error('rates', error instanceof Error ? error.name : 'unknown');

    if (!stored) {
      if (error instanceof NetworkError || error instanceof ValidationError) {
        throw error;
      }

      throw new NetworkError('Não foi possível consultar a cotação.', {
        cause: error,
      });
    }

    return { quote: stored, origin: 'cache' };
  }
}

export async function readStoredQuote(deps: {
  base: string;
  quote: string;
  date?: string | null;
  rates?: ExchangeRateRepository;
}): Promise<ExchangeRate | null> {
  const base = deps.base.trim().toUpperCase();
  const quote = deps.quote.trim().toUpperCase();
  const date = deps.date?.trim() ? deps.date.trim() : null;

  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote) || base === quote) {
    return null;
  }

  if (date && !isCivilDate(date)) {
    return null;
  }

  const repository = deps.rates ?? (await defaultRates());

  return cachedQuote(repository, base, quote, date);
}

async function cachedQuote(
  repository: ExchangeRateRepository,
  base: string,
  quote: string,
  date: string | null,
): Promise<ExchangeRate | null> {
  const cached = (await repository.list()).find(
    item => item.base === base && item.quote === quote,
  );

  if (!cached || !isCivilDate(cached.quotedOn)) {
    return null;
  }

  if (date && cached.quotedOn !== date) {
    return null;
  }

  return cached;
}

async function request(
  url: string,
  fetchImpl: RatesFetcher,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, { signal: controller.signal });

    if (!response.ok) {
      throw httpError(response.status);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof NetworkError || error instanceof ValidationError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new NetworkError('A consulta da cotação demorou demais.');
    }

    throw new NetworkError('Não foi possível consultar a cotação.', {
      cause: error,
    });
  } finally {
    clearTimeout(timer);
  }
}

function httpError(status: number): NetworkError {
  if (status === 404) {
    return new NetworkError('Não há cotação para esta data ou este par.');
  }

  if (status === 422 || status === 400) {
    return new NetworkError('A Frankfurter não aceitou esta consulta.');
  }

  return new NetworkError('Não foi possível consultar a cotação.');
}

function rateUrl(base: string, quote: string, date: string | null): string {
  const path = `${apiUrl()}/v2/rate/${base.toLowerCase()}/${quote.toLowerCase()}`;

  return date ? `${path}?date=${date}` : path;
}

function apiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_EXCHANGE_API_URL;

  if (typeof configured === 'string' && configured.trim() !== '') {
    return configured.replace(/\/$/, '');
  }

  return 'https://api.frankfurter.dev';
}

async function defaultRates(): Promise<ExchangeRateRepository> {
  const { getUseCaseDeps } = await import('@/services/database');
  const deps = await getUseCaseDeps();

  return deps.rates;
}
