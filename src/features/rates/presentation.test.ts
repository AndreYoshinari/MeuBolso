import { convertRate, describeQuote } from '@/features/rates/presentation';

const quote = {
  quotedOn: '2026-11-06',
  fetchedAt: '2026-11-06T15:04:00.000Z',
};

test('labels a saved quote, an old quote and an unavailable quote', () => {
  expect(
    describeQuote({
      quote,
      origin: 'cache',
      today: '2026-11-06',
      errorMessage: null,
    }),
  ).toMatchObject({
    title: 'Sem conexão',
    unavailable: false,
  });
  expect(
    describeQuote({
      quote,
      origin: 'cache',
      today: '2026-11-06',
      errorMessage: null,
    }).detail,
  ).toContain('Não é uma cotação ao vivo');

  expect(
    describeQuote({
      quote,
      origin: 'network',
      today: '2026-11-06',
      errorMessage: null,
    }).title,
  ).toBe('Cotação de hoje');

  expect(
    describeQuote({
      quote: { ...quote, quotedOn: '2024-01-02' },
      origin: 'network',
      today: '2026-11-06',
      errorMessage: null,
    }).title,
  ).toBe('Cotação antiga');

  expect(
    describeQuote({
      quote: null,
      origin: null,
      today: '2026-11-06',
      errorMessage: 'Não foi possível consultar a cotação.',
    }),
  ).toEqual({
    title: 'Sem conexão',
    detail: 'Não há cotação salva neste aparelho.',
    unavailable: true,
  });
});

test('converts with the decimal text and does not turn the rate into a float', () => {
  expect(convertRate('1', '5.4856')).toBe('5,4856');
  expect(convertRate('10', '4.871')).toBe('48,71');
  expect(convertRate('1,5', '2')).toBe('3');
  expect(convertRate('abc', '5.4856')).toBeNull();
});
