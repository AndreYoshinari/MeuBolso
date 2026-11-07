import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CategoriesScreen } from '@/features/categories/categories-screen';
import { ThemeProvider } from '@/theme';

const mockPush = jest.fn();
const mockRefetch = jest.fn(async () => undefined);

const mockState: {
  data:
    | {
        id: string;
        name: string;
        icon: string;
        color: string;
        type: 'income' | 'expense';
        isDefault: boolean;
      }[]
    | undefined;
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

jest.mock('@/features/categories/hooks', () => ({
  useCategories: () => ({
    ...mockState,
    refetch: mockRefetch,
  }),
  useCategoryTransactionCounts: () => ({
    data: { food: 2 },
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
        <CategoriesScreen />
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

test('shows loading and a read error', async () => {
  mockState.isLoading = true;
  const loading = await renderScreen();
  expect(loading.getByText('Carregando categorias')).toBeTruthy();

  mockState.isLoading = false;
  mockState.errorMessage = 'Não foi possível ler as categorias.';
  const error = await renderScreen();
  expect(error.getByText('Não foi possível ler as categorias.')).toBeTruthy();

  await act(async () => {
    fireEvent.press(error.getByLabelText('Tentar de novo'));
  });
  await waitFor(() => {
    expect(mockRefetch).toHaveBeenCalled();
  });
});

test('lists a category with its transaction count', async () => {
  mockState.data = [
    {
      id: 'food',
      name: 'Alimentação',
      icon: 'cafe',
      color: '#FF6B7A',
      type: 'expense',
      isDefault: true,
    },
  ];
  const screen = await renderScreen();

  expect(screen.getByText('Despesas')).toBeTruthy();
  expect(screen.getByText('Padrão · 2 lançamentos')).toBeTruthy();

  await act(async () => {
    fireEvent.press(
      screen.getByLabelText('Alimentação. Padrão · 2 lançamentos'),
    );
  });
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/categories/[id]',
    params: { id: 'food' },
  });
});
