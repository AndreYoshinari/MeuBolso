import { render, screen } from '@testing-library/react-native';

import { CurrencyText } from '@/components/currency-text';
import { ThemeProvider } from '@/theme';

test('shows an expense as a negative amount', async () => {
  await render(
    <ThemeProvider>
      <CurrencyText amountCents={18690} kind="expense" />
    </ThemeProvider>,
  );

  expect(screen.getByText(/-R\$\s*186,90/)).toBeTruthy();
});
