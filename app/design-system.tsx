import { Redirect } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppDivider,
  AppHeader,
  AppInput,
  AppText,
  CurrencyText,
  EmptyState,
  ErrorView,
  LoadingView,
  ScreenContainer,
  TransactionItem,
} from '@/components';
import { useTheme, type Theme } from '@/theme';

const sampleTransactions = [
  {
    id: 'salary',
    title: 'Salário',
    category: 'Receita',
    dateLabel: '05 nov',
    amountCents: 850000,
    kind: 'income',
  },
  {
    id: 'market',
    title: 'Mercado',
    category: 'Alimentação',
    dateLabel: '04 nov',
    amountCents: 18690,
    kind: 'expense',
  },
] as const;

export default function DesignSystemRoute() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return <DesignSystemScreen />;
}

function DesignSystemScreen() {
  const { theme, setScheme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [note, setNote] = useState('');

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll>
      <AppHeader
        showBack
        subtitle="Amostra interna dos componentes"
        title="Design System"
      />

      <View style={styles.row}>
        <View style={styles.flex}>
          <AppButton
            label="Escuro"
            onPress={() => setScheme('dark')}
            variant={theme.scheme === 'dark' ? 'primary' : 'secondary'}
          />
        </View>
        <View style={styles.flex}>
          <AppButton
            label="Claro"
            onPress={() => setScheme('light')}
            variant={theme.scheme === 'light' ? 'primary' : 'secondary'}
          />
        </View>
      </View>

      <Section title="Cores">
        <View style={styles.swatches}>
          <Swatch color={theme.colors.background} label="Fundo" />
          <Swatch color={theme.colors.surface} label="Card" />
          <Swatch color={theme.colors.primary} label="Violeta" />
          <Swatch color={theme.colors.income} label="Receita" />
          <Swatch color={theme.colors.expense} label="Despesa" />
        </View>
      </Section>

      <Section title="Tipografia">
        <AppText variant="display">Display</AppText>
        <AppText variant="title">Título</AppText>
        <AppText variant="headline">Manchete</AppText>
        <AppText>Texto de corpo para leitura corrida.</AppText>
        <AppText color="muted" variant="caption">
          Legenda auxiliar
        </AppText>
      </Section>

      <Section title="Botões">
        <AppButton label="Primário" onPress={() => undefined} />
        <AppButton
          label="Secundário"
          onPress={() => undefined}
          variant="secondary"
        />
        <AppButton label="Fantasma" onPress={() => undefined} variant="ghost" />
        <AppButton
          label="Destrutivo"
          onPress={() => undefined}
          variant="danger"
        />
        <AppButton label="Carregando" loading onPress={() => undefined} />
      </Section>

      <Section title="Campo">
        <AppInput
          label="Descrição"
          onChangeText={setNote}
          placeholder="Ex.: Almoço"
          value={note}
        />
        <AppInput
          error="Informe um valor."
          label="Valor"
          onChangeText={() => undefined}
          value=""
        />
      </Section>

      <Section title="Dinheiro">
        <AppCard>
          <AppText color="muted" variant="caption">
            Exemplo de saldo
          </AppText>
          <CurrencyText amountCents={325890} kind="income" variant="display" />
          <AppDivider />
          <View style={styles.row}>
            <CurrencyText
              amountCents={120000}
              kind="income"
              variant="headline"
            />
            <CurrencyText
              amountCents={45210}
              kind="expense"
              variant="headline"
            />
          </View>
        </AppCard>
        {sampleTransactions.map(item => (
          <TransactionItem
            key={item.id}
            amountCents={item.amountCents}
            category={item.category}
            dateLabel={item.dateLabel}
            kind={item.kind}
            title={item.title}
          />
        ))}
      </Section>

      <Section title="Estados">
        <AppCard>
          <EmptyState
            message="Nenhum lançamento neste período."
            title="Lista vazia"
          />
        </AppCard>
        <View style={styles.statePreview}>
          <LoadingView message="Carregando exemplo" />
        </View>
        <View style={styles.statePreview}>
          <ErrorView message="Não foi possível carregar os dados de exemplo." />
        </View>
      </Section>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <AppText variant="headline">{title}</AppText>
      {children}
    </View>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm, width: '30%' }}>
      <View
        style={{
          backgroundColor: color,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          height: 48,
        }}
      />
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    flex: {
      flex: 1,
    },
    swatches: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    statePreview: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      minHeight: 180,
    },
  });
}
