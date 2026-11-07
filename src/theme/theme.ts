import { darkColors, lightColors, type ThemeColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type ColorScheme = 'dark' | 'light';

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

const palettes: Record<ColorScheme, ThemeColors> = {
  dark: darkColors,
  light: lightColors,
};

export function createTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: palettes[scheme],
    spacing,
    radius,
    typography,
  };
}
