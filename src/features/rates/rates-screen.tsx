import { useState } from 'react';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppInput,
  AppText,
  ScreenContainer,
} from '@/components';
import {
  canRequest,
  useAvailableCurrencies,
  useRateQuote,
  useStoredQuote,
  type RateRequest,
} from '@/features/rates/hooks';
import { convertRate, describeQuote } from '@/features/rates/presentation';
import { isCivilDate } from '@/lib/period';

const initialRequest: RateRequest = {
  base: 'USD',
  quote: 'BRL',
  date: null,
};

export function RatesScreen() {
  const [base, setBase] = useState(initialRequest.base);
  const [quote, setQuote] = useState(initialRequest.quote);
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('1');
  const [request, setRequest] = useState(initialRequest);
  const [formError, setFormError] = useState<string | null>(null);
  const currencies = useAvailableCurrencies();
  const quoteState = useRateQuote(request);
  const stored = useStoredQuote(request);
  const shown = quoteState.data
    ? quoteState.data
    : stored.data
      ? { quote: stored.data, origin: 'cache' as const }
      : null;
  const description = describeQuote({
    quote: shown?.quote ?? null,
    origin: shown?.origin ?? null,
    today: civilToday(new Date()),
    errorMessage: quoteState.errorMessage,
    checking: quoteState.isLoading && !quoteState.data,
  });
  const conversion =
    shown && !description.unavailable
      ? convertRate(amount.trim() === '' ? '1' : amount, shown.quote.rate)
      : null;

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll>
      <AppHeader showBack title="Cotações" />
      <AppText color="muted">
        As cotações são informativas e não alteram seus lançamentos.
      </AppText>
      <AppInput
        autoCapitalize="characters"
        label="Moeda de origem"
        onChangeText={value => setBase(value.toUpperCase())}
        value={base}
      />
      <AppInput
        autoCapitalize="characters"
        label="Moeda de destino"
        onChangeText={value => setQuote(value.toUpperCase())}
        value={quote}
      />
      <AppInput
        label="Data"
        onChangeText={setDate}
        placeholder="AAAA-MM-DD"
        value={date}
      />
      <AppInput
        keyboardType="decimal-pad"
        label="Valor para converter"
        onChangeText={setAmount}
        value={amount}
      />
      <AppText color="muted">
        {currencyStatus(currencies.data, currencies.errorMessage)}
      </AppText>
      {formError ? <AppText color="expense">{formError}</AppText> : null}
      <AppButton label="Consultar" onPress={submit} />
      {quoteState.isLoading ? (
        <AppText color="muted">Consultando a Frankfurter.</AppText>
      ) : null}
      <AppCard>
        <AppText variant="headline">{description.title}</AppText>
        {shown && !description.unavailable ? (
          <AppText variant="title">
            {`1 ${shown.quote.base} = ${convertRate('1', shown.quote.rate) ?? shown.quote.rate} ${shown.quote.quote}`}
          </AppText>
        ) : null}
        {conversion ? (
          <AppText>{`${amount.trim() === '' ? '1' : amount} = ${conversion}`}</AppText>
        ) : null}
        <AppText color="muted">{description.detail}</AppText>
      </AppCard>
      {quoteState.errorMessage && quoteState.data ? (
        <AppButton
          label="Tentar de novo"
          onPress={() => void quoteState.refetch()}
          variant="secondary"
        />
      ) : null}
    </ScreenContainer>
  );

  function submit() {
    const next = {
      base: base.trim().toUpperCase(),
      quote: quote.trim().toUpperCase(),
      date: date.trim(),
    };

    if (!canRequest(next)) {
      setFormError('Escolha duas moedas diferentes, com três letras.');
      return;
    }

    if (next.date !== '' && !isCivilDate(next.date)) {
      setFormError('Informe a data como AAAA-MM-DD.');
      return;
    }

    if (
      currencies.data &&
      (!currencies.data.some(item => item.code === next.base) ||
        !currencies.data.some(item => item.code === next.quote))
    ) {
      setFormError('Uma das moedas não está disponível na Frankfurter.');
      return;
    }

    setFormError(null);
    const nextRequest = {
      base: next.base,
      quote: next.quote,
      date: next.date === '' ? null : next.date,
    };

    if (
      nextRequest.base === request.base &&
      nextRequest.quote === request.quote &&
      nextRequest.date === request.date
    ) {
      void quoteState.refetch();
      return;
    }

    setRequest(nextRequest);
  }
}

function currencyStatus(
  currencies: { code: string }[] | undefined,
  errorMessage: string | null,
): string {
  if (errorMessage) {
    return 'Sem conexão. A lista de moedas não foi atualizada. A última cotação salva neste aparelho ainda pode aparecer.';
  }

  if (!currencies) {
    return 'Carregando moedas.';
  }

  return `${currencies.length} moedas disponíveis.`;
}

function civilToday(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}
