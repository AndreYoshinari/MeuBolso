import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/app-error-boundary';
import { DatabaseProvider } from '@/database/DatabaseProvider';
import { createAppQueryClient } from '@/providers/query-client';
import { darkColors } from '@/theme/colors';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [queryClient] = useState(createAppQueryClient);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: darkColors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppErrorBoundary>
            <DatabaseProvider>
              <RootNavigator />
            </DatabaseProvider>
          </AppErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 280,
          gestureEnabled: true,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="transactions/new"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="transactions/[id]/index" />
        <Stack.Screen name="transactions/[id]/edit" />
        <Stack.Screen
          name="budgets/new"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="budgets/[id]" />
        <Stack.Screen name="categories/index" />
        <Stack.Screen
          name="categories/new"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="categories/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="rates" />
        {__DEV__ ? <Stack.Screen name="design-system" /> : null}
      </Stack>
    </>
  );
}
