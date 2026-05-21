const colors = {
  background: '#06101D',
  surface: '#0D1828',
  surfaceLight: '#17263A',
  primary: '#37D5FF',
  danger: '#FF4D5E',
  warning: '#FFB84D',
  success: '#2FE67B',
  accent: '#7C5CFF',
  graphite: '#101827',
  textPrimary: '#FFFFFF',
  textSecondary: '#9EB0C8',
  textMuted: '#5B6D83',
  border: '#203149',
  terminalBg: '#030913',
  terminalText: '#31F29D',
};

export const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const theme = {
  colors: {
    ...colors,
    transparent: 'transparent',
  },
  typography: {
    fontFamily: 'Inter_400Regular',
    fontBold: 'Inter_700Bold',
    fontMono: 'Inter_400Regular',
  },
  spacing: {
    s4: 4,
    s8: 8,
    s12: 12,
    s16: 16,
    s20: 20,
    s24: 24,
    s32: 32,
    s48: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  shadows: {
    card: {
      shadowColor: colors.background,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
    elevated: {
      shadowColor: colors.background,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 8,
    },
  },
  opacity: {
    successPill: withAlpha(colors.success, 0.15),
    dangerPill: withAlpha(colors.danger, 0.15),
    warningPill: withAlpha(colors.warning, 0.18),
    primaryPill: withAlpha(colors.primary, 0.15),
    accentPill: withAlpha(colors.accent, 0.16),
    glass: 'rgba(13, 24, 40, 0.78)',
    floodZone: withAlpha(colors.primary, 0.25),
    congestionZone: withAlpha(colors.warning, 0.3),
    modalBackdrop: withAlpha(colors.background, 0.88),
  },
};

export type CiroTheme = typeof theme;
