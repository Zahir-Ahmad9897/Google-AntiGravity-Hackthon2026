const colors = {
  background: '#0A0F1E',
  surface: '#131929',
  surfaceLight: '#1E2A40',
  primary: '#00D4FF',
  danger: '#FF4444',
  warning: '#FFAA00',
  success: '#00CC66',
  textPrimary: '#FFFFFF',
  textSecondary: '#8899BB',
  textMuted: '#445566',
  border: '#1E2A40',
  terminalBg: '#060D18',
  terminalText: '#00FF88',
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
    floodZone: withAlpha(colors.primary, 0.25),
    congestionZone: withAlpha(colors.warning, 0.3),
    modalBackdrop: withAlpha(colors.background, 0.88),
  },
};

export type CiroTheme = typeof theme;
