import { z } from 'zod';

import { ValidationError } from '@/lib/errors';
import { isCivilDate } from '@/lib/period';

const currencyCode = z.string().regex(/^[A-Z]{3}$/);

const currencySchema = z.object({
  iso_code: currencyCode,
  name: z.string().trim().min(1),
  symbol: z.string().nullable().optional(),
  type: z.string(),
  start_date: z.string(),
  end_date: z.string(),
});

const rateSchema = z.object({
  date: z.string(),
  base: currencyCode,
  quote: currencyCode,
  rate: z.number().finite().positive(),
});

export type FrankfurterCurrency = z.infer<typeof currencySchema>;

export type FrankfurterRate = z.infer<typeof rateSchema>;

export type CurrencyOption = {
  code: string;
  name: string;
};

export function parseCurrencies(payload: unknown): CurrencyOption[] {
  const parsed = z.array(currencySchema).safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError([
      {
        field: 'currencies',
        message: 'A lista de moedas recebida é inválida.',
      },
    ]);
  }

  return parsed.data
    .filter(currency => currency.type === 'currency')
    .map(currency => ({ code: currency.iso_code, name: currency.name }))
    .sort((left, right) => left.code.localeCompare(right.code));
}

export function parseRateQuote(body: string): {
  base: string;
  quote: string;
  rate: string;
  quotedOn: string;
} {
  let payload: unknown;

  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    throw new ValidationError([
      { field: 'rates', message: 'A cotação recebida é inválida.' },
    ]);
  }

  const parsed = rateSchema.safeParse(payload);

  if (!parsed.success || !isCivilDate(parsed.data.date)) {
    throw new ValidationError([
      { field: 'rates', message: 'A cotação recebida é inválida.' },
    ]);
  }

  const rate = readRateText(body, parsed.data.rate);

  if (!rate) {
    throw new ValidationError([
      { field: 'rates', message: 'A cotação recebida é inválida.' },
    ]);
  }

  return {
    base: parsed.data.base,
    quote: parsed.data.quote,
    rate,
    quotedOn: parsed.data.date,
  };
}

function readRateText(body: string, parsedRate: number): string | null {
  const match = /"rate"\s*:\s*(\d+(?:\.\d+)?)/.exec(body);

  if (!match) {
    return null;
  }

  if (Number(match[1]) !== parsedRate) {
    return null;
  }

  return match[1];
}

export const currenciesFixture = [
  {
    iso_code: 'BRL',
    iso_numeric: '986',
    name: 'Brazilian Real',
    symbol: 'R$',
    type: 'currency',
    start_date: '1994-07-01',
    end_date: '2026-11-06',
  },
  {
    iso_code: 'BTC',
    iso_numeric: null,
    name: 'Bitcoin',
    symbol: '₿',
    type: 'crypto',
    start_date: '2010-07-18',
    end_date: '2026-11-05',
  },
  {
    iso_code: 'USD',
    iso_numeric: '840',
    name: 'United States Dollar',
    symbol: '$',
    type: 'currency',
    start_date: '1948-06-21',
    end_date: '2026-11-08',
  },
] as const;

export const latestRateFixture =
  '{"date":"2026-11-06","base":"USD","quote":"BRL","rate":5.4856}';

export const historicalRateFixture =
  '{"date":"2024-01-02","base":"USD","quote":"BRL","rate":4.871}';
