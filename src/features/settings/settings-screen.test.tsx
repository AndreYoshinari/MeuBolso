import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SettingsScreen } from '@/features/settings/settings-screen';
import { ThemeProvider } from '@/theme';

const mockSettings = {
  displayName: '',
  currency: 'BRL' as const,
  theme: 'dark' as const,
  notificationsEnabled: false,
  reminderDay: 1,
  reminderHour: 9,
  onboardingCompleted: false,
  hydrated: true,
  setDisplayName: jest.fn(),
  setTheme: jest.fn(async () => undefined),
  setNotificationsEnabled: jest.fn(),
  setReminder: jest.fn(),
  setOnboardingCompleted: jest.fn(),
  notice: null as string | null,
  nameError: null as string | null,
  saveDisplayName: jest.fn(async () => undefined),
  enableNotifications: jest.fn(async () => undefined),
  disableNotifications: jest.fn(async () => undefined),
  changeReminder: jest.fn(async () => undefined),
  clearLocalData: jest.fn(async () => undefined),
  clearError: null as string | null,
  clearing: false,
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/features/settings/hooks', () => ({
  useSettings: () => mockSettings,
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

function renderSettings() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <SettingsScreen version="1.0.0" />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockSettings.theme = 'dark';
  mockSettings.notificationsEnabled = false;
  mockSettings.reminderDay = 1;
  mockSettings.reminderHour = 9;
  mockSettings.setTheme.mockClear();
  mockSettings.saveDisplayName.mockClear();
  mockSettings.changeReminder.mockClear();
  mockSettings.enableNotifications.mockClear();
  mockSettings.clearLocalData.mockClear();
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

test('saves the name, theme and reminder from the settings screen', async () => {
  const screen = await renderSettings();

  expect(screen.getByText('Real (BRL)')).toBeTruthy();
  expect(screen.getByText('Versão 1.0.0')).toBeTruthy();
  expect(screen.getByText('MeuBolso')).toBeTruthy();

  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Nome de exibição'), 'Ana');
  });
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Salvar nome'));
  });
  expect(mockSettings.saveDisplayName).toHaveBeenCalledWith('Ana');

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Claro'));
  });
  expect(mockSettings.setTheme).toHaveBeenCalledWith('light');

  await act(async () => {
    fireEvent.press(screen.getByLabelText('Dia seguinte'));
  });
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Hora seguinte'));
  });
  expect(mockSettings.changeReminder).toHaveBeenCalledWith(2, 9);
  expect(mockSettings.changeReminder).toHaveBeenCalledWith(1, 10);

  await act(async () => {
    fireEvent(screen.getByLabelText('Notificações'), 'valueChange', true);
  });
  expect(mockSettings.enableNotifications).toHaveBeenCalled();
});

test('clears local data only after confirmation', async () => {
  const screen = await renderSettings();

  await act(async () => {
    fireEvent.press(screen.getByText('Limpar dados locais'));
  });

  const buttons = jest.mocked(Alert.alert).mock.calls[0]?.[2];
  const confirm = buttons?.find(button => button.text === 'Limpar');

  await act(async () => {
    confirm?.onPress?.();
  });

  expect(mockSettings.clearLocalData).toHaveBeenCalledTimes(1);
});
