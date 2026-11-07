import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  toTransactionInput,
  type TransactionFormValues,
} from '@/features/transactions/schema';
import { TransactionForm } from '@/features/transactions/transaction-form';
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
  onSubmit: (values: TransactionFormValues) => Promise<void> = async () =>
    undefined,
) {
  return render(
    wrap(
      <TransactionForm
        categories={categories}
        defaultValues={{
          description: '',
          amount: '',
          type: 'expense',
          categoryId: '',
          date: '2026-11-06',
          notes: '',
        }}
        errorMessage={null}
        isPending={false}
        onSubmit={onSubmit}
        submitLabel="Salvar"
        title="Nova transação"
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

test('shows the field error and submits the amount in cents', async () => {
  const onSubmit = jest.fn(async (_values: TransactionFormValues) => undefined);
  const screen = await renderForm(onSubmit);

  await press(screen.getByLabelText('Salvar'));

  expect(screen.getByText('Informe a descrição.')).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();

  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Descrição'), 'Mercado');
    fireEvent.changeText(screen.getByLabelText('Valor'), '1250');
    fireEvent.changeText(screen.getByLabelText('Observações'), 'semana');
  });
  await press(screen.getByLabelText('Alimentação'));
  await press(screen.getByLabelText('Salvar'));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  const values = onSubmit.mock.calls[0]?.[0];

  expect(values?.amount).toBe('12,50');

  if (!values) {
    throw new Error('O formulário não enviou os dados.');
  }

  expect(toTransactionInput(values).amountCents).toBe(1250);
  expect(values).toMatchObject({
    description: 'Mercado',
    type: 'expense',
    categoryId: 'food',
    date: '2026-11-06',
    notes: 'semana',
  });
});
