import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RatesScreen } from '@/features/rates/rates-screen';
import { ThemeProvider } from '@/theme';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

const mockRates = {
  currencies: {
    data: [
      { code: 'BRL', name: 'Brazilian Real' },
      { code: 'USD', name: 'United States Dollar' },
    ],
    isLoading: false,
    errorMessage: null as string | null,
    refetch: jest.fn(),
  },
  quote: {
    data: undefined as
      | {
          origin: 'network' | 'cache';
          quote: {
            base: string;
            quote: string;
            rate: string;
            quotedOn: string;
            fetchedAt: string;
          };
        }
      | undefined,
    isLoading: false,
    errorMessage: 'Não foi possível consultar a cotação.' as string | null,
    refetch: jest.fn(),
  },
};

jest.mock('@/features/rates/hooks', () => ({
  useAvailableCurrencies: () => mockRates.currencies,
  useRateQuote: () => mockRates.quote,
  useStoredQuote: () => ({
    data: null,
    isLoading: false,
    errorMessage: null,
    refetch: jest.fn(),
  }),
  canRequest: (request: { base: string; quote: string }) =>
    /^[A-Z]{3}$/.test(request.base) &&
    /^[A-Z]{3}$/.test(request.quote) &&
    request.base !== request.quote,
}));

beforeEach(() => {
  mockRates.currencies.errorMessage = null;
  mockRates.quote.data = undefined;
  mockRates.quote.errorMessage = 'Não foi possível consultar a cotação.';
  mockRates.quote.isLoading = false;
});

test('says the quote is unavailable when nothing was saved', async () => {
  const screen = await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <RatesScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

  expect(screen.getByText('Sem conexão')).toBeTruthy();
  expect(screen.getByText('Não há cotação salva neste aparelho.')).toBeTruthy();
  expect(screen.queryByText(/1 USD =/)).toBeNull();
});

test('marks a cached quote as saved on the device', async () => {
  mockRates.quote.errorMessage = null;
  mockRates.quote.data = {
    origin: 'cache',
    quote: {
      base: 'USD',
      quote: 'BRL',
      rate: '5.4856',
      quotedOn: '2026-11-06',
      fetchedAt: '2026-11-06T15:04:00.000Z',
    },
  };

  const screen = await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <RatesScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

  expect(screen.getByText('Sem conexão')).toBeTruthy();
  expect(screen.getByText('1 USD = 5,4856 BRL')).toBeTruthy();
  expect(screen.getByText(/Não é uma cotação ao vivo/)).toBeTruthy();
});
