import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorView } from '@/components/error-view';
import { LoadingView } from '@/components/loading-view';
import { initializeAppDatabase } from '@/database/app-database';
import { loadPreferences } from '@/services/preferences';
import { syncFinancialReminder } from '@/services/reminders';
import { usePreferencesStore } from '@/stores/preferences';
import { useTheme } from '@/theme';

type DatabaseProviderProps = {
  children: ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { theme } = useTheme();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    let active = true;

    initializeAppDatabase()
      .then(() => loadPreferences())
      .then(async preferences => {
        usePreferencesStore.getState().hydrate(preferences);

        try {
          await syncFinancialReminder(preferences, 'quiet');
        } catch (error: unknown) {
          console.error(
            'notifications',
            error instanceof Error ? error.name : 'unknown',
          );
        }

        if (active) {
          setStatus('ready');
        }
      })
      .catch((error: unknown) => {
        console.error(
          'database',
          error instanceof Error ? error.name : 'unknown',
        );
        if (active) {
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  if (status === 'ready') {
    return children;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {status === 'loading' ? (
        <LoadingView message="Preparando seus dados" />
      ) : (
        <ErrorView
          message="Não foi possível abrir os dados neste aparelho."
          onRetry={() => {
            setStatus('loading');
            setAttempt(current => current + 1);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
