// Design tokens. Source of truth for color, spacing, radii, typography, motion.
// Components should import from here (or from ./index), never hardcode values.

export const palette = {
  // Neutrals (warm-dark scale)
  bg: '#0E0F11',
  surface: '#16181C',
  surface2: '#1E2126',
  border: '#272A30',
  text1: '#ECECEE',
  text2: '#A6A8AD',
  text3: '#878A91', // 4.67:1 on surface2, 5.55:1 on bg — meets WCAG AA small text

  // Brand / accent
  accent: '#8AB4F8',
  accentStrong: '#B8D2FF',

  // Semantic
  up: '#6FBF8A',
  down: '#E07A7A',
  warning: '#E5B472',

  // Crypto identity (desaturated; glyph/icon use only)
  btc: '#D9923F',
  eth: '#7B8AC4',
  sol: '#9B7CD1',

  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export const colors = {
  // Surface roles
  bg: palette.bg,
  surface: palette.surface,
  surface2: palette.surface2,
  border: palette.border,

  // Text roles
  text1: palette.text1,
  text2: palette.text2,
  text3: palette.text3,
  onAccent: palette.bg, // text on top of a filled accent

  // Brand
  accent: palette.accent,
  accentStrong: palette.accentStrong,

  // Semantic
  up: palette.up,
  down: palette.down,
  warning: palette.warning,

  // Crypto glyphs
  btc: palette.btc,
  eth: palette.eth,
  sol: palette.sol,

  overlay: palette.overlay,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 9999,
} as const;

// Font families. Values must match the keys loaded via expo-font in App.tsx.
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

// Typography presets. Numeric preset adds tabular-nums for price/percent alignment.
import type { TextStyle } from 'react-native';

export const typography = {
  microStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  } satisfies TextStyle,
  captionStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  bodySmStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  } satisfies TextStyle,
  bodyStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
  } satisfies TextStyle,
  bodyLg: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,
  titleSm: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
  } satisfies TextStyle,
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 20,
    lineHeight: 28,
  } satisfies TextStyle,
  display: {
    fontFamily: fontFamily.semibold,
    fontSize: 24,
    lineHeight: 32,
  } satisfies TextStyle,
  hero: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
  } satisfies TextStyle,
  numeric: {
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
};

export const motion = {
  fast: 120,
  base: 180,
  slow: 240,
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Typography = typeof typography;
