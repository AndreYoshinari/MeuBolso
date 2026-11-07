import { AppText } from '@/components/app-text';
import {
  formatSignedCurrency,
  resolveDisplayCents,
  type AmountKind,
} from '@/lib/money';
import type { TextVariant } from '@/theme/typography';

type CurrencyTextProps = {
  amountCents: number;
  kind?: AmountKind;
  variant?: Extract<
    TextVariant,
    'display' | 'title' | 'headline' | 'body' | 'label'
  >;
};

export function CurrencyText({
  amountCents,
  kind,
  variant = 'body',
}: CurrencyTextProps) {
  const displayCents = resolveDisplayCents(amountCents, kind);
  const color =
    displayCents > 0 ? 'income' : displayCents < 0 ? 'expense' : 'muted';
  const label = formatSignedCurrency(displayCents);

  return (
    <AppText accessibilityRole="text" color={color} variant={variant}>
      {label}
    </AppText>
  );
}
