import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/theme';

const iconGlyph = {
  home: 'home-outline',
  homeActive: 'home',
  list: 'list-outline',
  listActive: 'list',
  budget: 'flag-outline',
  budgetActive: 'flag',
  chart: 'bar-chart-outline',
  chartActive: 'bar-chart',
  settings: 'settings-outline',
  settingsActive: 'settings',
  back: 'chevron-back',
  forward: 'chevron-forward',
  income: 'arrow-down-circle-outline',
  expense: 'arrow-up-circle-outline',
  wallet: 'wallet-outline',
  plus: 'add',
  tag: 'pricetag-outline',
  cart: 'cart-outline',
  car: 'car-outline',
  medkit: 'medkit-outline',
  school: 'school-outline',
  briefcase: 'briefcase-outline',
  trending: 'trending-up-outline',
  cafe: 'cafe-outline',
  gift: 'gift-outline',
  receipt: 'receipt-outline',
  search: 'search-outline',
  alert: 'alert-circle-outline',
  empty: 'file-tray-outline',
} as const satisfies Record<string, keyof typeof Ionicons.glyphMap>;

export type IconName = keyof typeof iconGlyph;

type AppIconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function AppIcon({ name, size = 24, color }: AppIconProps) {
  const { theme } = useTheme();

  return (
    <Ionicons
      color={color ?? theme.colors.text}
      name={iconGlyph[name]}
      size={size}
    />
  );
}
