export const colors = {
  // Brand Primary (Enterprise Royal Blue)
  primary: '#1D4ED8',
  primaryDark: '#1E3A8A',
  primaryLight: '#3B82F6',
  primarySoft: '#EFF6FF',
  primaryBorder: '#BFDBFE',

  // Accent & Brand Secondary
  accent: '#0D9488',
  accentSoft: '#F0FDFA',

  // Financial Semantics: Outstanding / BAKI
  danger: '#DC2626',
  dangerDark: '#991B1B',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
  baki: '#DC2626',

  // Financial Semantics: Paid / Collected
  success: '#10B981',
  successDark: '#047857',
  successSoft: '#ECFDF5',
  successBorder: '#A7F3D0',
  settled: '#10B981',

  // Financial Semantics: Partial
  warning: '#D97706',
  warningDark: '#B45309',
  warningSoft: '#FFFBEB',
  warningBorder: '#FDE68A',
  partial: '#D97706',

  // Neutral Scales (Slate / Ink)
  ink: '#0F172A',
  navy: '#0F172A',
  inkSecondary: '#334155',
  muted: '#64748B',
  mutedLight: '#94A3B8',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  card: '#FFFFFF',
  white: '#FFFFFF',

  // App Canvas Backgrounds
  lightBg: '#F8FAFC',
  darkBg: '#090D16',
  darkCard: '#131B2E',
  darkBorder: '#1E293B',
  darkMuted: '#64748B',

  // Theme object alias
  light: {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    sub: '#64748B',
    border: '#E2E8F0',
  },
  dark: {
    bg: '#090D16',
    card: '#131B2E',
    text: '#F8FAFC',
    sub: '#94A3B8',
    border: '#1E293B',
  },
};

export const shadows = {
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  glowPrimary: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};
