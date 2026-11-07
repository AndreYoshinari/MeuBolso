import {
  civilMonthRange,
  formatCivilDate,
  formatPeriodLabel,
  formatYearMonth,
  isLeapYear,
  isUtcTimestamp,
  parseCivilDate,
  parseYearMonth,
  periodFromCivilDate,
  shiftYearMonth,
} from '@/lib/period';

test('shifts a civil month without crossing the supported years', () => {
  expect(shiftYearMonth({ year: 2026, month: 11 }, 1)).toEqual({
    year: 2026,
    month: 12,
  });
  expect(shiftYearMonth({ year: 2026, month: 1 }, -1)).toEqual({
    year: 2025,
    month: 12,
  });
  expect(shiftYearMonth({ year: 1, month: 1 }, -1)).toEqual({
    year: 1,
    month: 1,
  });
  expect(formatPeriodLabel({ year: 2026, month: 11 })).toBe('novembro de 2026');
  expect(formatCivilDate('2026-11-06')).toBe('06/11/2026');
});

test('parses a civil date without shifting the day', () => {
  expect(parseCivilDate('2026-03-01')).toEqual({
    year: 2026,
    month: 3,
    day: 1,
  });
  expect(periodFromCivilDate('2026-03-01')).toEqual({
    year: 2026,
    month: 3,
  });
});

test('rejects calendar dates that do not exist', () => {
  expect(parseCivilDate('2026-02-31')).toBeNull();
  expect(parseCivilDate('2023-02-29')).toBeNull();
  expect(parseCivilDate('2026-13-01')).toBeNull();
  expect(parseCivilDate('2026-03-01T00:00:00.000Z')).toBeNull();
  expect(parseCivilDate('01/03/2026')).toBeNull();
});

test('accepts leap day only in leap years', () => {
  expect(isLeapYear(2024)).toBe(true);
  expect(isLeapYear(2000)).toBe(true);
  expect(isLeapYear(1900)).toBe(false);
  expect(parseCivilDate('2024-02-29')).toEqual({
    year: 2024,
    month: 2,
    day: 29,
  });
});

test('accepts only UTC timestamps with an existing civil date', () => {
  expect(isUtcTimestamp('2026-03-01T00:00:00.000Z')).toBe(true);
  expect(isUtcTimestamp('2026-02-31T00:00:00.000Z')).toBe(false);
  expect(isUtcTimestamp('2026-03-01T25:00:00.000Z')).toBe(false);
  expect(isUtcTimestamp('2026-03-01')).toBe(false);
});

test('keeps March when building the current civil month', () => {
  expect(civilMonthRange(new Date(2026, 2, 1))).toEqual({
    year: 2026,
    month: 3,
    from: '2026-03-01',
    to: '2026-03-31',
  });
  expect(formatYearMonth(2026, 3)).toBe('2026-03');
  expect(parseYearMonth('2026-03')).toEqual({ year: 2026, month: 3 });
  expect(parseYearMonth('2026-13')).toBeNull();
});
