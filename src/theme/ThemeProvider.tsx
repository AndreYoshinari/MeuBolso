import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createTheme, type ColorScheme, type Theme } from '@/theme/theme';
import { usePreferencesStore } from '@/stores/preferences';

type ThemeContextValue = {
  theme: Theme;
  setScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const scheme = usePreferencesStore(state => state.theme);
  const setTheme = usePreferencesStore(state => state.setTheme);
  const theme = useMemo(() => createTheme(scheme), [scheme]);
  const value = useMemo(
    () => ({
      theme,
      setScheme: (next: ColorScheme) => {
        void setTheme(next).catch((error: unknown) => {
          console.error(
            'preferences',
            error instanceof Error ? error.name : 'unknown',
          );
        });
      },
    }),
    [setTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  }

  return value;
}
