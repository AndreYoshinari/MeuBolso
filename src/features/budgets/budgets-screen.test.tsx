import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BudgetsScreen } from '@/features/budgets/budgets-screen';
import type { BudgetCard } from '@/features/budgets/presentation';
import { ThemeProvider } from '@/theme';

const mockPush = jest.fn();
const mockRefetch = jest.fn(async () => undefined);

const mockState: {
  data: BudgetCard[] | undefined;
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

jest.mock('@/features/budgets/hooks', () => ({
  useBudgets: () => ({
    ...mockState,
    refetch: mockRefetch,
  }),
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

const card: BudgetCard = {
  id: 'budget-food',
  categoryId: 'food',
  categoryName: 'Alimentação',
  month: 11,
  year: 2026,
  limitCents: 10000,
  spentCents: 8000,
  remainingCents: 2000,
  basisPoints: 8000,
  level: 'warning',
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <BudgetsScreen today={new Date(2026, 10, 6)} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockPush.mockReset();
  mockRefetch.mockClear();
  mockState.data = undefined;
  mockState.isLoading = false;
  mockState.errorMessage = null;
});

test('shows loading, error and an empty month', async () => {
  mockState.isLoading = true;
  const loading = await renderScreen();
  expect(loading.getByText('Carregando orçamentos')).toBeTruthy();

  mockState.isLoading = false;
  mockState.errorMessage = 'Não foi possível ler os orçamentos.';
  const error = await renderScreen();
  expect(error.getByText('Não foi possível ler os orçamentos.')).toBeTruthy();

  await act(async () => {
    fireEvent.press(error.getByLabelText('Tentar de novo'));
  });
  await waitFor(() => {
    expect(mockRefetch).toHaveBeenCalled();
  });

  mockState.errorMessage = null;
  mockState.data = [];
  const empty = await renderScreen();
  expect(empty.getByText('Nenhum orçamento')).toBeTruthy();
});

test('shows the spent amount and opens the budget', async () => {
  mockState.data = [card];
  const screen = await renderScreen();

  expect(screen.getByText('Alimentação')).toBeTruthy();
  expect(screen.getByText('Perto do limite')).toBeTruthy();
  expect(screen.getByText('80%')).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Alimentação. 80%. Perto do limite'));
  });
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/budgets/[id]',
    params: { id: 'budget-food', period: '2026-11' },
  });
});
