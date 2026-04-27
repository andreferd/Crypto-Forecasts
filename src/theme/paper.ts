import { MD3DarkTheme } from 'react-native-paper';
import { colors, fontFamily } from './tokens';

// Paper's MD3 theme extended with our tokens. Passed to <PaperProvider theme=...>.
export const paperTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    background: colors.bg,
    surface: colors.surface,
    surfaceVariant: colors.surface2,
    primary: colors.accent,
    onPrimary: colors.onAccent,
    secondary: colors.accentStrong,
    error: colors.down,
    onSurface: colors.text1,
    onSurfaceVariant: colors.text2,
    outline: colors.border,
    outlineVariant: colors.border,
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    default: { ...MD3DarkTheme.fonts.default, fontFamily: fontFamily.regular },
    bodySmall: { ...MD3DarkTheme.fonts.bodySmall, fontFamily: fontFamily.regular },
    bodyMedium: { ...MD3DarkTheme.fonts.bodyMedium, fontFamily: fontFamily.regular },
    bodyLarge: { ...MD3DarkTheme.fonts.bodyLarge, fontFamily: fontFamily.regular },
    labelSmall: { ...MD3DarkTheme.fonts.labelSmall, fontFamily: fontFamily.medium },
    labelMedium: { ...MD3DarkTheme.fonts.labelMedium, fontFamily: fontFamily.medium },
    labelLarge: { ...MD3DarkTheme.fonts.labelLarge, fontFamily: fontFamily.medium },
    titleSmall: { ...MD3DarkTheme.fonts.titleSmall, fontFamily: fontFamily.semibold },
    titleMedium: { ...MD3DarkTheme.fonts.titleMedium, fontFamily: fontFamily.semibold },
    titleLarge: { ...MD3DarkTheme.fonts.titleLarge, fontFamily: fontFamily.semibold },
    headlineSmall: { ...MD3DarkTheme.fonts.headlineSmall, fontFamily: fontFamily.semibold },
    headlineMedium: { ...MD3DarkTheme.fonts.headlineMedium, fontFamily: fontFamily.bold },
    headlineLarge: { ...MD3DarkTheme.fonts.headlineLarge, fontFamily: fontFamily.bold },
    displaySmall: { ...MD3DarkTheme.fonts.displaySmall, fontFamily: fontFamily.bold },
    displayMedium: { ...MD3DarkTheme.fonts.displayMedium, fontFamily: fontFamily.bold },
    displayLarge: { ...MD3DarkTheme.fonts.displayLarge, fontFamily: fontFamily.bold },
  },
};
