export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 24,
    lineHeight: 32,
  },
  headline: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 26,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

export type TextVariant = keyof typeof typography;
