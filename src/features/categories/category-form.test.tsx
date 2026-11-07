import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CategoryForm } from '@/features/categories/category-form';
import { defaultCategoryValues } from '@/features/categories/options';
import {
  toCategoryInput,
  type CategoryFormValues,
} from '@/features/categories/schema';
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

function renderForm(
  onSubmit: (values: CategoryFormValues) => Promise<void> = async () =>
    undefined,
) {
  return render(
    wrap(
      <CategoryForm
        defaultValues={defaultCategoryValues()}
        errorMessage={null}
        isPending={false}
        onSubmit={onSubmit}
        submitLabel="Salvar"
        title="Nova categoria"
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

test('asks for a name and submits the chosen icon and color', async () => {
  const onSubmit = jest.fn(async (_values: CategoryFormValues) => undefined);
  const screen = await renderForm(onSubmit);

  await press(screen.getByLabelText('Salvar'));

  expect(screen.getByText('Informe o nome da categoria.')).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();

  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Nome'), 'Presentes');
  });
  await press(screen.getByLabelText('Presente'));
  await press(screen.getByLabelText('Cor #FF6B7A'));
  await press(screen.getByLabelText('Receita'));
  await press(screen.getByLabelText('Salvar'));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  const values = onSubmit.mock.calls[0]?.[0];

  if (!values) {
    throw new Error('O formulário não enviou os dados.');
  }

  expect(toCategoryInput(values)).toEqual({
    name: 'Presentes',
    type: 'income',
    icon: 'gift',
    color: '#FF6B7A',
  });
});
