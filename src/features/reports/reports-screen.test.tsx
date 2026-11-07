import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { FinancialReport } from '@/features/reports/model';
import { ReportsScreen } from '@/features/reports/reports-screen';
import { ThemeProvider } from '@/theme';

jest.mock('react-native-gifted-charts', () => ({
  BarChart: () => null,
  LineChart: () => null,
  PieChart: () => null,
}));

const mockRefetch = jest.fn(async () => undefined);

const mockState: { mode: 'ready' | 'loading' | 'error' | 'empty' } = {
  mode: 'ready',
};

const mockNovember = sample('Alimentação', 2500, 'novembro de 2026');
const mockOctober = sample('Transporte', 5000, 'outubro de 2026');
const mockDecember = sample('Lazer', 1000, 'novembro a dezembro de 2026');

jest.mock('@/features/reports/hooks', () => ({
  useReport: (range: { from: { month: number }; to: { month: number } }) => {
    if (mockState.mode === 'loading') {
      return {
        data: undefined,
        isLoading: true,
        errorMessage: null,
        refetch: mockRefetch,
      };
    }

    if (mockState.mode === 'error') {
      return {
        data: undefined,
        isLoading: false,
        errorMessage: 'Não foi possível carregar os relatórios.',
        refetch: mockRefetch,
      };
    }

    const selected =
      range.from.month === 10
        ? mockOctober
        : range.to.month === 12
          ? mockDecember
          : mockNovember;

    return {
      data:
        mockState.mode === 'empty'
          ? {
              ...selected,
              empty: true,
              months: [],
              comparison: [],
              chartCategories: [],
              topCategories: [],
            }
          : selected,
      isLoading: false,
      errorMessage: null,
      refetch: mockRefetch,
    };
  },
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

function renderReports() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <ReportsScreen today={new Date(2026, 10, 6)} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockState.mode = 'ready';
  mockRefetch.mockClear();
});

test('updates every report when the filter changes', async () => {
  const screen = await renderReports();

  expect(screen.getByText('Receitas e despesas')).toBeTruthy();
  expect(screen.getByText('Despesas por categoria')).toBeTruthy();
  expect(screen.getByText('Evolução do saldo')).toBeTruthy();
  expect(screen.getByText('Comparação entre meses')).toBeTruthy();
  expect(screen.getByText('Maiores gastos')).toBeTruthy();
  expect(screen.getByText('1. Alimentação')).toBeTruthy();
  expect(screen.getByText('25% das receitas')).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Personalizado'));
  });
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Até, mês seguinte'));
  });

  expect(screen.getByText('1. Lazer')).toBeTruthy();
  expect(
    screen.getAllByText('novembro a dezembro de 2026').length,
  ).toBeGreaterThan(0);
  expect(screen.queryByText('1. Alimentação')).toBeNull();

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Mês anterior'));
  });

  expect(screen.getByText('1. Transporte')).toBeTruthy();
  expect(screen.getByText('50% das receitas')).toBeTruthy();
  expect(screen.queryByText('1. Lazer')).toBeNull();
  expect(screen.getByText('Receitas e despesas')).toBeTruthy();
  expect(screen.getByText('Despesas por categoria')).toBeTruthy();
  expect(screen.getByText('Evolução do saldo')).toBeTruthy();
  expect(screen.getByText('Comparação entre meses')).toBeTruthy();
  expect(screen.getByText('Maiores gastos')).toBeTruthy();
});

test('shows loading, error and empty states', async () => {
  mockState.mode = 'loading';
  const loading = await renderReports();
  expect(loading.getByText('Carregando os relatórios')).toBeTruthy();
  expect(loading.getByLabelText('Mês atual')).toBeTruthy();

  mockState.mode = 'error';
  const error = await renderReports();
  expect(
    error.getByText('Não foi possível carregar os relatórios.'),
  ).toBeTruthy();

  await act(async () => {
    fireEvent.press(error.getByLabelText('Tentar de novo'));
  });
  await waitFor(() => {
    expect(mockRefetch).toHaveBeenCalled();
  });

  mockState.mode = 'empty';
  const empty = await renderReports();
  expect(empty.getByText('Nenhum lançamento neste período')).toBeTruthy();
  expect(empty.queryByText('Receitas e despesas')).toBeNull();
  expect(empty.queryByText('1. Alimentação')).toBeNull();
});

function sample(
  categoryName: string,
  basisPoints: number,
  label: string,
): FinancialReport {
  const category = {
    categoryId: categoryName,
    categoryName,
    spentCents: 5000,
    basisPoints: 10000,
  };

  return {
    from: { year: 2026, month: 11 },
    to: { year: 2026, month: 11 },
    label,
    incomeCents: 20000,
    expenseCents: 5000,
    balanceCents: 15000,
    spendingBasisPoints: basisPoints,
    months: [
      {
        year: 2026,
        month: 11,
        label,
        tick: 'nov',
        incomeCents: 20000,
        expenseCents: 5000,
        balanceCents: 15000,
        cumulativeCents: 15000,
        spendingBasisPoints: basisPoints,
      },
    ],
    comparison: [
      {
        year: 2026,
        month: 11,
        label,
        incomeCents: 20000,
        expenseCents: 5000,
        balanceCents: 15000,
        balanceDeltaCents: null,
      },
    ],
    chartCategories: [category],
    topCategories: [category],
    empty: false,
  };
}
