export type CivilDateParts = {
  year: number;
  month: number;
  day: number;
};

export type YearMonth = {
  year: number;
  month: number;
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) {
    return true;
  }

  if (year % 100 === 0) {
    return false;
  }

  return year % 4 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }

  return DAYS_IN_MONTH[month - 1] ?? 0;
}

export function parseCivilDate(value: string): CivilDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    return null;
  }

  if (day < 1 || day > daysInMonth(year, month)) {
    return null;
  }

  return { year, month, day };
}

export function isCivilDate(value: string): boolean {
  return parseCivilDate(value) !== null;
}

export function isYearMonth(value: unknown): value is YearMonth {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const period = value as { year?: unknown; month?: unknown };

  return (
    typeof period.year === 'number' &&
    Number.isInteger(period.year) &&
    period.year >= 1 &&
    period.year <= 9999 &&
    typeof period.month === 'number' &&
    Number.isInteger(period.month) &&
    period.month >= 1 &&
    period.month <= 12
  );
}

export function periodFromCivilDate(value: string): YearMonth | null {
  const date = parseCivilDate(value);

  if (!date) {
    return null;
  }

  return { year: date.year, month: date.month };
}

export function formatYearMonth(year: number, month: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

const monthNames = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

export function formatPeriodLabel(period: YearMonth): string {
  return `${monthNames[period.month - 1]} de ${period.year}`;
}

export function formatCivilDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return value;
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function shiftYearMonth(period: YearMonth, offset: number): YearMonth {
  if (!Number.isInteger(offset)) {
    return period;
  }

  const index = period.year * 12 + (period.month - 1) + offset;
  const minIndex = 12;
  const maxIndex = 9999 * 12 + 11;

  if (index < minIndex || index > maxIndex) {
    return period;
  }

  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

export function parseYearMonth(value: string): YearMonth | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const period = { year: Number(match[1]), month: Number(match[2]) };

  return isYearMonth(period) ? period : null;
}

export function periodStart(year: number, month: number): string {
  return `${formatYearMonth(year, month)}-01`;
}

export function nextPeriodStart(year: number, month: number): string {
  if (month === 12) {
    return periodStart(year + 1, 1);
  }

  return periodStart(year, month + 1);
}

export function civilMonthRange(now: Date): {
  year: number;
  month: number;
  from: string;
  to: string;
} {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const lastDay = String(daysInMonth(year, month)).padStart(2, '0');

  return {
    year,
    month,
    from: periodStart(year, month),
    to: `${formatYearMonth(year, month)}-${lastDay}`,
  };
}

export function isUtcTimestamp(value: string): boolean {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.exec(value);

  if (!match) {
    return false;
  }

  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  if (hour > 23 || minute > 59 || second > 59) {
    return false;
  }

  return isCivilDate(`${match[1]}-${match[2]}-${match[3]}`);
}
