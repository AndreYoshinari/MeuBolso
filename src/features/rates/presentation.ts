import type { ExchangeRate } from '@/domain/types';
import { formatCivilDate } from '@/lib/period';
import type { QuoteOrigin } from '@/services/rates';

export { formatCivilDate };

export type QuoteDescription = {
  title: string;
  detail: string;
  unavailable: boolean;
};

export function describeQuote(input: {
  quote: Pick<ExchangeRate, 'quotedOn' | 'fetchedAt'> | null;
  origin: QuoteOrigin | null;
  today: string;
  errorMessage: string | null;
  checking?: boolean;
}): QuoteDescription {
  if (!input.quote || !input.origin) {
    if (isOfflineFailure(input.errorMessage)) {
      return {
        title: 'Sem conexão',
        detail: 'Não há cotação salva neste aparelho.',
        unavailable: true,
      };
    }

    return {
      title: 'Cotação indisponível',
      detail:
        input.errorMessage ??
        'Não foi possível consultar a cotação e não há valor salvo.',
      unavailable: true,
    };
  }

  const quotedOn = formatCivilDate(input.quote.quotedOn);
  const fetchedAt = formatUtcTimestamp(input.quote.fetchedAt);

  if (input.origin === 'cache') {
    return {
      title: input.checking ? 'Cotação salva neste aparelho' : 'Sem conexão',
      detail: input.checking
        ? `Exibindo a cotação salva neste aparelho, referente a ${quotedOn}. Consultado em ${fetchedAt}.`
        : `Exibindo a última cotação salva neste aparelho, referente a ${quotedOn}. Consultado em ${fetchedAt}. Não é uma cotação ao vivo.`,
      unavailable: false,
    };
  }

  if (input.quote.quotedOn !== input.today) {
    return {
      title: 'Cotação antiga',
      detail: `A Frankfurter publicou esta cotação em ${quotedOn}. Não é a cotação de hoje.`,
      unavailable: false,
    };
  }

  return {
    title: 'Cotação de hoje',
    detail: `Publicada em ${quotedOn}.`,
    unavailable: false,
  };
}

export function convertRate(amount: string, rate: string): string | null {
  const amountUnits = parseDecimal(normalizeDecimal(amount), 8);
  const rateUnits = parseDecimal(rate, 12);

  if (!amountUnits || !rateUnits || amountUnits.units < 0n) {
    return null;
  }

  const productPlaces = amountUnits.places + rateUnits.places;
  const product = amountUnits.units * rateUnits.units;

  return formatDecimal(roundHalfUp(product, productPlaces, 4), 4);
}

export function formatUtcTimestamp(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);

  if (!match) {
    return value;
  }

  return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]} UTC`;
}

function isOfflineFailure(message: string | null): boolean {
  if (!message) {
    return false;
  }

  return (
    message.includes('Não foi possível consultar a cotação') ||
    message.includes('demorou demais')
  );
}

function normalizeDecimal(value: string): string {
  return value.trim().replace(',', '.');
}

function parseDecimal(
  value: string,
  maxPlaces: number,
): { units: bigint; places: number } | null {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value);

  if (!match) {
    return null;
  }

  const fraction = match[2] ?? '';

  if (fraction.length > maxPlaces) {
    return null;
  }

  return {
    units: BigInt(`${match[1]}${fraction}`),
    places: fraction.length,
  };
}

function roundHalfUp(
  units: bigint,
  fromPlaces: number,
  toPlaces: number,
): bigint {
  if (fromPlaces <= toPlaces) {
    return units * 10n ** BigInt(toPlaces - fromPlaces);
  }

  const factor = 10n ** BigInt(fromPlaces - toPlaces);
  return (units + factor / 2n) / factor;
}

function formatDecimal(units: bigint, places: number): string {
  const digits = units.toString().padStart(places + 1, '0');
  const whole = digits.slice(0, digits.length - places);
  const fraction = digits.slice(digits.length - places).replace(/0+$/, '');

  return fraction ? `${whole},${fraction}` : whole;
}
