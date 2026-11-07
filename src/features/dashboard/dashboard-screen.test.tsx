import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DashboardScreen } from '@/features/dashboard/dashboard-screen';
import type { DashboardData } from '@/features/dashboard/hooks';
import { ThemeProvider } from '@/theme';

const mockPush = jest.fn();
const mockRefetch = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

jest.mock('react-native-gifted-charts', () => ({
  BarChart: () => null,
  PieChart: () => null,
}));

const mockDashboard: {
  data: DashboardData | undefined;
  isLoading: boolean;
  errorMessage: string | null;
  refetch: () => Promise<void>;
} = {
  data: undefined,
  isLoading: false,
  errorMessage: null,
  refetch: mockRefetch,
};

jest.mock('@/features/dashboard/hooks', () => ({
  useDashboard: () => mockDashboard,
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

const filled: DashboardData = {
  totalBalanceCents: 12000,
  summary: {
    period: { year: 2026, month: 11 },
    incomeCents: 20000,
    expenseCents: 5000,
    balanceCents: 15000,
    spendingBasisPoints: 2500,
  },
  expenses: [
    {
      categoryId: 'food',
      categoryName: 'Alimentação',
      spentCents: 5000,
      basisPoints: 10000,
    },
  ],
  recent: [
    {
      id: 'market',
      description: 'Mercado',
      amountCents: 5000,
      type: 'expense',
      categoryName: 'Alimentação',
      date: '2026-11-06',
    },
  ],
};

function renderDashboard() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <DashboardScreen today={new Date(2026, 10, 6, 9)} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockPush.mockReset();
  mockRefetch.mockReset();
  mockDashboard.data = filled;
  mockDashboard.isLoading = false;
  mockDashboard.errorMessage = null;
});

test('shows the persisted month and opens a transaction or a new entry', async () => {
  const screen = await renderDashboard();

  expect(screen.getByText('Bom dia')).toBeTruthy();
  expect(screen.getByText('Saldo total')).toBeTruthy();
  expect(screen.getByText('Receitas do mês')).toBeTruthy();
  expect(screen.getByText('Despesas do mês')).toBeTruthy();
  expect(screen.getByText('novembro de 2026')).toBeTruthy();
  expect(screen.getByText('Mercado')).toBeTruthy();
  expect(screen.queryByText('Demonstração')).toBeNull();

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Mês seguinte'));
  });
  expect(screen.getByText('dezembro de 2026')).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Mercado'));
    fireEvent.press(screen.getByLabelText('Nova receita'));
    fireEvent.press(screen.getByLabelText('Nova despesa'));
  });

  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/transactions/[id]',
    params: { id: 'market' },
  });
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/transactions/new',
    params: { type: 'income' },
  });
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/transactions/new',
    params: { type: 'expense' },
  });
});

test('shows a loading state before the first result', async () => {
  mockDashboard.data = undefined;
  mockDashboard.isLoading = true;
  const screen = await renderDashboard();

  expect(screen.getByText('Carregando o início')).toBeTruthy();
});

test('shows an error and retries the dashboard query', async () => {
  mockDashboard.data = undefined;
  mockDashboard.errorMessage = 'Não foi possível carregar o início.';
  const screen = await renderDashboard();

  expect(screen.getByText('Não foi possível carregar o início.')).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Tentar de novo'));
  });
  await waitFor(() => {
    expect(mockRefetch).toHaveBeenCalled();
  });
});

test('shows an empty month without sample transactions', async () => {
  mockDashboard.data = {
    ...filled,
    summary: { ...filled.summary, incomeCents: 0, expenseCents: 0 },
    expenses: [],
    recent: [],
  };
  const screen = await renderDashboard();

  expect(screen.getByText('Nenhum lançamento neste mês')).toBeTruthy();
  expect(screen.getByText('Saldo total')).toBeTruthy();
  expect(screen.getByLabelText('Nova despesa')).toBeTruthy();
  expect(screen.queryByText('Mercado')).toBeNull();
});
