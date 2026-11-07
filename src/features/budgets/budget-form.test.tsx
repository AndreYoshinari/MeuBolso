import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BudgetForm } from '@/features/budgets/budget-form';
import {
  toBudgetInput,
  type BudgetFormValues,
} from '@/features/budgets/schema';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

const categories = [
  { id: 'food', name: 'Alimentação', type: 'expense' as const },
  { id: 'salary', name: 'Salário', type: 'income' as const },
];

function renderForm(
  onSubmit: (values: BudgetFormValues) => Promise<void> = async () => undefined,
) {
  return render(
    wrap(
      <BudgetForm
        categories={categories}
        defaultValues={{
          categoryId: '',
          amount: '',
          month: 3,
          year: 2026,
        }}
        errorMessage={null}
        isPending={false}
        onSubmit={onSubmit}
        title="Novo orçamento"
      />,
    ),
  );
}

function wrap(screen: ReactElement) {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>{screen}</ThemeProvider>
    </SafeAreaProvider>
  );
}

async function press(element: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(element);
  });
}

test('asks for a limit and submits the amount in cents', async () => {
  const onSubmit = jest.fn(async (_values: BudgetFormValues) => undefined);
  const screen = await renderForm(onSubmit);

  await press(screen.getByLabelText('Salvar'));

  expect(screen.getByText('Informe o valor.')).toBeTruthy();
  expect(screen.getByText('Escolha uma categoria.')).toBeTruthy();
  expect(screen.queryByLabelText('Salário')).toBeNull();
  expect(onSubmit).not.toHaveBeenCalled();

  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Limite'), '10000');
  });
  await press(screen.getByLabelText('Alimentação'));
  await press(screen.getByLabelText('Salvar'));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  const values = onSubmit.mock.calls[0]?.[0];

  if (!values) {
    throw new Error('O formulário não enviou os dados.');
  }

  expect(toBudgetInput(values)).toEqual({
    categoryId: 'food',
    amountCents: 10_000,
    month: 3,
    year: 2026,
  });
});
