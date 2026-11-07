import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppErrorBoundary } from '@/components/app-error-boundary';
import { AppText } from '@/components/app-text';
import { ThemeProvider } from '@/theme';

let shouldFail = true;

function Probe(): ReactNode {
  if (shouldFail) {
    throw new Error('falha de tela');
  }

  return <AppText>Pronto</AppText>;
}

beforeEach(() => {
  shouldFail = true;
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('shows a fixed message and mounts the screen again', async () => {
  const screen = await render(
    <ThemeProvider>
      <AppErrorBoundary>
        <Probe />
      </AppErrorBoundary>
    </ThemeProvider>,
  );

  expect(screen.getByText('Não foi possível mostrar esta tela.')).toBeTruthy();

  shouldFail = false;

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Tentar de novo'));
  });

  expect(screen.getByText('Pronto')).toBeTruthy();
});
