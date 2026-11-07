import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppInput,
  AppText,
  ScreenContainer,
} from '@/components';
import { useSettings } from '@/features/settings/hooks';
import { routes } from '@/features/navigation/routes';
import { ChoiceChip, NavigationRow } from '@/features/navigation/widgets';
import { useTheme, type Theme } from '@/theme';

type SettingsScreenProps = {
  version?: string;
};

export function SettingsScreen({
  version = Constants.expoConfig?.version ?? '1.0.0',
}: SettingsScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const settings = useSettings();
  const [draftName, setDraftName] = useState(settings.displayName);
  const [savedName, setSavedName] = useState(settings.displayName);

  if (settings.displayName !== savedName) {
    setSavedName(settings.displayName);
    setDraftName(settings.displayName);
  }

  function confirmClear() {
    Alert.alert(
      'Limpar dados locais',
      'Isso apaga lançamentos, orçamentos, categorias personalizadas e cotações deste aparelho.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: () => {
            void settings.clearLocalData().catch(() => undefined);
          },
        },
      ],
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll>
      <AppHeader showBack title="Configurações" />
      <AppCard>
        <View style={styles.section}>
          <AppInput
            autoCapitalize="words"
            label="Nome de exibição"
            onChangeText={setDraftName}
            placeholder="Como quer ser chamado"
            value={draftName}
            error={settings.nameError ?? undefined}
          />
          <AppButton
            label="Salvar nome"
            onPress={() => {
              void settings.saveDisplayName(draftName);
            }}
            variant="secondary"
          />
        </View>
      </AppCard>
      <AppCard>
        <View style={styles.section}>
          <AppText variant="headline">Moeda padrão</AppText>
          <AppText variant="label">Real (BRL)</AppText>
          <AppText color="muted" variant="caption">
            Os lançamentos permanecem em reais. A cotação não converte valores.
          </AppText>
        </View>
      </AppCard>
      <AppCard>
        <View style={styles.section}>
          <AppText variant="headline">Tema</AppText>
          <View style={styles.filters}>
            <ChoiceChip
              label="Escuro"
              onPress={() => {
                void settings.setTheme('dark');
              }}
              selected={settings.theme === 'dark'}
            />
            <ChoiceChip
              label="Claro"
              onPress={() => {
                void settings.setTheme('light');
              }}
              selected={settings.theme === 'light'}
            />
          </View>
        </View>
      </AppCard>
      <AppCard>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.copy}>
              <AppText variant="headline">Notificações</AppText>
              <AppText color="muted" variant="caption">
                Avisos de orçamento e o lembrete mensal.
              </AppText>
            </View>
            <Switch
              accessibilityLabel="Notificações"
              onValueChange={enabled => {
                void (enabled
                  ? settings.enableNotifications()
                  : settings.disableNotifications());
              }}
              thumbColor={theme.colors.onPrimary}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              value={settings.notificationsEnabled}
            />
          </View>
          {settings.notice ? (
            <AppText color="expense" variant="caption">
              {settings.notice}
            </AppText>
          ) : null}
          <AppText variant="label">Lembrete financeiro</AppText>
          <AppText color="muted" variant="caption">
            Uma vez por mês, no dia e na hora escolhidos.
          </AppText>
          <ReminderStepper
            label={`Dia ${settings.reminderDay}`}
            nextLabel="Dia seguinte"
            onNext={() => {
              void settings.changeReminder(
                settings.reminderDay + 1,
                settings.reminderHour,
              );
            }}
            onPrevious={() => {
              void settings.changeReminder(
                settings.reminderDay - 1,
                settings.reminderHour,
              );
            }}
            previousDisabled={settings.reminderDay <= 1}
            previousLabel="Dia anterior"
            nextDisabled={settings.reminderDay >= 28}
          />
          <ReminderStepper
            label={`${String(settings.reminderHour).padStart(2, '0')}:00`}
            nextLabel="Hora seguinte"
            onNext={() => {
              void settings.changeReminder(
                settings.reminderDay,
                settings.reminderHour + 1,
              );
            }}
            onPrevious={() => {
              void settings.changeReminder(
                settings.reminderDay,
                settings.reminderHour - 1,
              );
            }}
            previousDisabled={settings.reminderHour <= 0}
            previousLabel="Hora anterior"
            nextDisabled={settings.reminderHour >= 23}
          />
        </View>
      </AppCard>
      <AppCard>
        <View style={styles.section}>
          <AppText variant="headline">Aplicativo</AppText>
          <AppText>MeuBolso</AppText>
          <AppText color="muted">{`Versão ${version}`}</AppText>
          <AppText color="muted">
            Controle financeiro pessoal, offline, neste aparelho.
          </AppText>
        </View>
      </AppCard>
      <NavigationRow
        detail="Padrão e personalizadas"
        icon="tag"
        label="Categorias"
        onPress={() => router.push(routes.categories)}
      />
      <NavigationRow
        detail="Cotações informativas"
        icon="wallet"
        label="Cotações"
        onPress={() => router.push(routes.rates)}
      />
      {__DEV__ ? (
        <NavigationRow
          detail="Amostras visuais do aplicativo"
          icon="settings"
          label="Design System"
          onPress={() => router.push(routes.designSystem)}
        />
      ) : null}
      <AppButton
        label="Limpar dados locais"
        loading={settings.clearing}
        onPress={confirmClear}
        variant="danger"
      />
      {settings.clearError ? (
        <AppText color="expense">{settings.clearError}</AppText>
      ) : null}
    </ScreenContainer>
  );
}

function ReminderStepper({
  label,
  previousLabel,
  nextLabel,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
}: {
  label: string;
  previousLabel: string;
  nextLabel: string;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityLabel={previousLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: previousDisabled }}
        disabled={previousDisabled}
        onPress={onPrevious}
        style={styles.iconButton}
      >
        <AppText color={previousDisabled ? 'muted' : 'default'}>{'‹'}</AppText>
      </Pressable>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityLabel={nextLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: nextDisabled }}
        disabled={nextDisabled}
        onPress={onNext}
        style={styles.iconButton}
      >
        <AppText color={nextDisabled ? 'muted' : 'default'}>{'›'}</AppText>
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      gap: theme.spacing.md,
    },
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    copy: {
      flex: 1,
      gap: theme.spacing.xs,
      minWidth: 0,
    },
    stepper: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    iconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
  });
}
