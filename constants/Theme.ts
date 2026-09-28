export const Theme = {
  colors: {
    bgTop: '#E8F0EC',
    bgMid: '#F3EDE4',
    bgBottom: '#F7F1E8',
    ink: '#1F2A24',
    inkSoft: '#4A5A52',
    muted: '#7A877F',
    line: 'rgba(31, 42, 36, 0.12)',
    accent: '#2F6F5E',
    accentSoft: 'rgba(47, 111, 94, 0.12)',
    warm: '#C4784A',
    warmSoft: 'rgba(196, 120, 74, 0.14)',
    dangerSoft: 'rgba(160, 70, 60, 0.1)',
    white: '#FFFcf7',
    overlay: 'rgba(20, 28, 24, 0.45)',
  },
  // Use iOS system CJK faces so Expo Go tunnel does not download ~60MB font files.
  fonts: {
    display: 'Songti SC',
    displayRegular: 'Songti SC',
    body: 'PingFang SC',
    bodyMedium: 'PingFang SC',
    bodyBold: 'PingFang SC',
  },
  space: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 22,
  },
} as const;

export type AppTheme = typeof Theme;
