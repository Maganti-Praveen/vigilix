/**
 * Vigilix Design Tokens
 * The single source of truth for all visual design decisions.
 *
 * Palette: Soft blue primary, subtle teal secondary
 * Style: Apple-like premium, smart-home aesthetics
 */

// ─── Color Palette ──────────────────────────────────────────────

export const palette = {
  // Reference Light Theme
  lightBg: '#F5F6F8',
  lightBg2: '#FFFFFF',
  lightSurface: 'rgba(255, 255, 255, 0.78)',
  lightSurface2: 'rgba(255, 255, 255, 0.94)',
  lightLine: 'rgba(18, 23, 31, 0.09)',
  lightText: '#111318',
  lightMuted: '#707782',
  lightAccent: '#3976FF',
  lightAccent2: '#6A98FF',
  lightSuccess: '#22A46A',
  lightDanger: '#D9555E',
  lightWarning: '#AD7A14',
  lightIcon: '#2F3540',

  // Reference Dark Theme
  darkBg: '#0A0B0D',
  darkBg2: '#111318',
  darkSurface: 'rgba(255, 255, 255, 0.055)',
  darkSurface2: 'rgba(255, 255, 255, 0.085)',
  darkLine: 'rgba(255, 255, 255, 0.095)',
  darkText: '#F4F5F7',
  darkMuted: '#9299A3',
  darkAccent: '#6F9CFF',
  darkAccent2: '#91B4FF',
  darkSuccess: '#56D493',
  darkDanger: '#FF6F74',
  darkWarning: '#EFBF62',
  darkIcon: '#D9DEE6',

  // HUD (for camera/viewer immersive view)
  hudBg: 'rgba(4, 8, 13, 0.62)',
  hudDock: 'rgba(6, 9, 14, 0.75)',
  hudBorder: 'rgba(255, 255, 255, 0.12)',
  hudText: '#F5F6F8',
  hudMuted: '#9299A3',

  // Primary — soft blue
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue300: '#93C5FD',
  blue400: '#60A5FA',
  blue500: '#3976FF',  // ← primary accent
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue800: '#1E40AF',
  blue900: '#1E3A8A',

  // Secondary — subtle teal
  teal50: '#F0FDFA',
  teal100: '#CCFBF1',
  teal200: '#99F6E4',
  teal300: '#5EEAD4',
  teal400: '#2DD4BF',
  teal500: '#14B8A6',
  teal600: '#0D9488',
  teal700: '#0F766E',

  // Neutrals — warm gray (not cold)
  gray50: '#FAFAFA',
  gray100: '#F5F6F8',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#707782',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111318',

  // Dark mode neutrals — elegant navy/graphite
  navy50: '#F0F4F8',
  navy100: '#D9E2EC',
  navy200: '#BCCCDC',
  navy300: '#9FB3C8',
  navy400: '#829AB1',
  navy500: '#627D98',
  navy600: '#486581',
  navy700: '#334E68',
  navy800: '#243B53',
  navy900: '#111318',
  navy950: '#0A0B0D',

  // Semantic
  success: '#22A46A',
  warning: '#AD7A14',
  danger: '#D9555E',
  info: '#3976FF',

  // Absolutes
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Typography ──────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },

  size: {
    /** 10px — tiny labels */
    xs: 10,
    /** 12px — captions, badges */
    sm: 12,
    /** 14px — body small, secondary */
    md: 14,
    /** 16px — body, primary text */
    base: 16,
    /** 18px — section labels */
    lg: 18,
    /** 20px — card titles */
    xl: 20,
    /** 24px — screen headings */
    '2xl': 24,
    /** 30px — large headings */
    '3xl': 30,
    /** 36px — hero text */
    '4xl': 36,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────

export const spacing = {
  /** 2px */ '0.5': 2,
  /** 4px */ '1': 4,
  /** 6px */ '1.5': 6,
  /** 8px */ '2': 8,
  /** 12px */ '3': 12,
  /** 16px */ '4': 16,
  /** 20px */ '5': 20,
  /** 24px */ '6': 24,
  /** 32px */ '8': 32,
  /** 40px */ '10': 40,
  /** 48px */ '12': 48,
  /** 64px */ '16': 64,
  /** 80px */ '20': 80,
} as const;

// ─── Border Radius ───────────────────────────────────────────────

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  input: 13,
  lg: 14,
  xl: 18,
  card: 22,
  '2xl': 24,
  '3xl': 32,
  pill: 999,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  }),
} as const;

// ─── Glass ───────────────────────────────────────────────────────

export const glass = {
  light: {
    background: 'rgba(255, 255, 255, 0.72)',
    border: 'rgba(255, 255, 255, 0.18)',
    blur: 20,
  },
  dark: {
    background: 'rgba(10, 25, 41, 0.75)',
    border: 'rgba(255, 255, 255, 0.08)',
    blur: 24,
  },
  frosted: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.06)',
    blur: 32,
  },
} as const;

// ─── Animation Durations ─────────────────────────────────────────

export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  glacial: 800,
} as const;

// ─── Icon Sizes ──────────────────────────────────────────────────

export const iconSize = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  '2xl': 40,
} as const;
