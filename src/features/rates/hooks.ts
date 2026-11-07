import {
  useQuery,
  useQueryState,
  type QueryState,
} from '@/features/query-state';
import { queryKeys } from '@/lib/query-keys';
import type { ExchangeRate } from '@/domain/types';
import {
  loadCurrencies,
  loadRateQuote,
  readStoredQuote,
  type RateQuoteResult,
} from '@/services/rates';
import type { CurrencyOption } from '@/services/frankfurter-schema';

export const RATES_STALE_TIME_MS = 6 * 60 * 60 * 1000;

export type RateRequest = {
  base: string;
  quote: string;
  date: string | null;
};

export function useAvailableCurrencies(): QueryState<CurrencyOption[]> {
  const query = useQuery({
    queryKey: queryKeys.rateCurrencies,
    staleTime: RATES_STALE_TIME_MS,
    retry: false,
    queryFn: () => loadCurrencies(),
  });

  return useQueryState(query);
}

export function useStoredQuote(
  request: RateRequest,
): QueryState<ExchangeRate | null> {
  const query = useQuery({
    queryKey: queryKeys.storedRate(request.base, request.quote, request.date),
    enabled: canRequest(request),
    queryFn: () =>
      readStoredQuote({
        base: request.base,
        quote: request.quote,
        date: request.date,
      }),
  });

  return useQueryState(query);
}

export function useRateQuote(
  request: RateRequest,
): QueryState<RateQuoteResult> {
  const query = useQuery({
    queryKey: queryKeys.rateQuote(request.base, request.quote, request.date),
    enabled: canRequest(request),
    staleTime: RATES_STALE_TIME_MS,
    retry: false,
    queryFn: () =>
      loadRateQuote({
        base: request.base,
        quote: request.quote,
        date: request.date,
      }),
  });

  return useQueryState(query);
}

export function canRequest(request: RateRequest): boolean {
  return (
    /^[A-Z]{3}$/.test(request.base) &&
    /^[A-Z]{3}$/.test(request.quote) &&
    request.base !== request.quote
  );
}
