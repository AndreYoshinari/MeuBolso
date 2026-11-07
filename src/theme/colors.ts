export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  income: string;
  expense: string;
  incomeSurface: string;
  expenseSurface: string;
};

export const darkColors: ThemeColors = {
  background: '#101318',
  surface: '#1A1F27',
  surfaceMuted: '#232A34',
  border: '#313844',
  text: '#F5F7FA',
  textMuted: '#A8B0BB',
  textSubtle: '#7E8794',
  primary: '#7C6AF7',
  primaryPressed: '#6856E0',
  onPrimary: '#FFFFFF',
  income: '#3DDC97',
  expense: '#FF6B7A',
  incomeSurface: '#143028',
  expenseSurface: '#3A1E24',
};

export const lightColors: ThemeColors = {
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F4',
  border: '#E2E6EB',
  text: '#14181F',
  textMuted: '#5C6570',
  textSubtle: '#7A8490',
  primary: '#5436E0',
  primaryPressed: '#432BC0',
  onPrimary: '#FFFFFF',
  income: '#0F9F6E',
  expense: '#E11D48',
  incomeSurface: '#E7F8F1',
  expenseSurface: '#FDECEE',
};
