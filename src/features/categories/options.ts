import type { IconName } from '@/components/app-icon';
import type { AmountKind } from '@/lib/money';

export const categoryIcons = [
  'income',
  'expense',
  'wallet',
  'home',
  'tag',
  'cart',
  'car',
  'medkit',
  'school',
  'briefcase',
  'trending',
  'cafe',
  'gift',
  'receipt',
] as const satisfies readonly IconName[];

export type CategoryIconName = (typeof categoryIcons)[number];

export const categoryIconLabels: Record<CategoryIconName, string> = {
  income: 'Ícone de receita',
  expense: 'Ícone de despesa',
  wallet: 'Carteira',
  home: 'Casa',
  tag: 'Etiqueta',
  cart: 'Compras',
  car: 'Transporte',
  medkit: 'Saúde',
  school: 'Educação',
  briefcase: 'Trabalho',
  trending: 'Investimento',
  cafe: 'Alimentação',
  gift: 'Presente',
  receipt: 'Conta',
};

export const categoryColors = [
  '#3DDC97',
  '#2BB673',
  '#14B8A6',
  '#4C8DFF',
  '#5436E0',
  '#7C6AF7',
  '#F0A202',
  '#FF8A5B',
  '#FF6B7A',
  '#E11D48',
  '#A8B0BB',
] as const;

export function categoryIconName(icon: string): CategoryIconName {
  if ((categoryIcons as readonly string[]).includes(icon)) {
    return icon as CategoryIconName;
  }

  return 'tag';
}

export function defaultCategoryValues(type: AmountKind = 'expense') {
  return {
    name: '',
    type,
    icon: 'tag' as const,
    color: categoryColors[5],
  };
}
