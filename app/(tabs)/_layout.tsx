import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type IconName } from '@/components/app-icon';
import { NewTransactionButton } from '@/features/navigation/new-transaction-button';
import { useTheme } from '@/theme';

const tabs = [
  { name: 'index', title: 'Início', icon: 'home', activeIcon: 'homeActive' },
  {
    name: 'transactions',
    title: 'Transações',
    icon: 'list',
    activeIcon: 'listActive',
  },
  {
    name: 'budgets',
    title: 'Orçamentos',
    icon: 'budget',
    activeIcon: 'budgetActive',
  },
  {
    name: 'reports',
    title: 'Relatórios',
    icon: 'chart',
    activeIcon: 'chartActive',
  },
] as const satisfies readonly {
  name: string;
  title: string;
  icon: IconName;
  activeIcon: IconName;
}[];

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          backgroundColor: theme.colors.background,
          flex: 1,
        },
      }),
    [theme.colors.background],
  );

  return (
    <View style={styles.shell}>
      <Tabs
        screenOptions={{
          headerShown: false,
          freezeOnBlur: true,
          lazy: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
          tabBarLabelStyle: {
            fontFamily: theme.typography.caption.fontFamily,
            fontSize: 11,
          },
          sceneStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {tabs.map(tab => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color, size, focused }) => (
                <AppIcon
                  color={
                    typeof color === 'string' ? color : theme.colors.textMuted
                  }
                  name={focused ? tab.activeIcon : tab.icon}
                  size={size}
                />
              ),
            }}
          />
        ))}
      </Tabs>
      <NewTransactionButton bottom={insets.bottom + 72} />
    </View>
  );
}
