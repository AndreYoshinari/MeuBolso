import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Transaction } from '@/domain/types';
import type { TransactionFilters } from '@/lib/transaction-filters';
import { TransactionsScreen } from '@/features/transactions/transactions-screen';
import { ThemeProvider } from '@/theme';

const mockPush = jest.fn();
const mockSetFilters = jest.fn();
const mockRefetch = jest.fn(async () => undefined);

const mockFilters: TransactionFilters = {
  from: '2026-11-01',
  to: '2026-11-30',
};

const mockState: {
  data: Transaction[] | undefined;
  isLoading: boolean;
  errorMessage: string | null;
} = {
  data: undefined,
  isLoading: false,
  errorMessage: null,
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock('@/features/transactions/hooks', () => ({
  useTransactionFilters: () => ({
    filters: mockFilters,
    setFilters: mockSetFilters,
    clearFilters: jest.fn(),
  }),
  useTransactions: () => ({
    ...mockState,
    refetch: mockRefetch,
  }),
}));

jest.mock('@/features/categories/hooks', () => ({
  useCategories: () => ({
    data: [
      {
        id: 'food',
        name: 'Alimentação',
        icon: 'cafe',
        color: '#FF6B7A',
        type: 'expense',
        isDefault: true,
      },
    ],
    isLoading: false,
    errorMessage: null,
    refetch: jest.fn(),
  }),
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <TransactionsScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockPush.mockReset();
  mockSetFilters.mockReset();
  mockRefetch.mockClear();
  mockState.data = undefined;
  mockState.isLoading = false;
  mockState.errorMessage = null;
});

test('shows loading, error and an empty history', async () => {
  mockState.isLoading = true;
  const loading = await renderScreen();
  expect(loading.getByText('Carregando lançamentos')).toBeTruthy();

  mockState.isLoading = false;
  mockState.errorMessage = 'Não foi possível ler os lançamentos.';
  const error = await renderScreen();
  expect(error.getByText('Não foi possível ler os lançamentos.')).toBeTruthy();

  await act(async () => {
    fireEvent.press(error.getByLabelText('Tentar de novo'));
  });
  await waitFor(() => {
    expect(mockRefetch).toHaveBeenCalled();
  });

  mockState.errorMessage = null;
  mockState.data = [];
  const empty = await renderScreen();
  expect(empty.getByText('Nenhum lançamento')).toBeTruthy();
});

test('filters the visible month and opens a transaction', async () => {
  mockState.data = [
    {
      id: 'market',
      description: 'Mercado',
      amountCents: 18690,
      type: 'expense',
      categoryId: 'food',
      date: '2026-11-06',
      notes: '',
      createdAt: '2026-11-06T12:00:00.000Z',
      updatedAt: '2026-11-06T12:00:00.000Z',
    },
  ];
  const screen = await renderScreen();

  expect(screen.getByText('novembro de 2026')).toBeTruthy();
  expect(screen.getByText('Mercado')).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Despesas'));
  });
  expect(mockSetFilters).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'expense', from: '2026-11-01' }),
  );

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Mês seguinte'));
  });
  expect(mockSetFilters).toHaveBeenCalledWith(
    expect.objectContaining({ from: '2026-12-01', to: '2026-12-31' }),
  );

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Mercado'));
  });
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/transactions/[id]',
    params: { id: 'market' },
  });
});
