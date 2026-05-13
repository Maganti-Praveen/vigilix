/**
 * Vigilix Design Tokens
 * The single source of truth for all visual design decisions.
 *
 * Palette: Soft blue primary, subtle teal secondary
 * Style: Apple-like premium, smart-home aesthetics
 */

// ─── Color Palette ──────────────────────────────────────────────

export const palette = {
  // Primary — soft blue
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue300: '#93C5FD',
  blue400: '#60A5FA',
  blue500: '#4F8EF7',  // ← primary accent
  blue600: '#3B82F6',
  blue700: '#2563EB',
  blue800: '#1D4ED8',
  blue900: '#1E3A8A',

  // Secondary — subtle teal
  teal50: '#F0FDFA',
  teal100: '#CCFBF1',
  teal200: '#99F6E4',
  teal300: '#5EEAD4',
  teal400: '#2DD4BF',
  teal500: '#14B8A6',  // ← secondary accent
  teal600: '#0D9488',
  teal700: '#0F766E',

  // Neutrals — warm gray (not cold)
  gray50: '#FAFAFA',
  gray100: '#F5F5F4',
  gray200: '#E7E5E4',
  gray300: '#D6D3D1',
  gray400: '#A8A29E',
  gray500: '#78716C',
  gray600: '#57534E',
  gray700: '#44403C',
  gray800: '#292524',
  gray900: '#1C1917',

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
  navy900: '#102A43',
  navy950: '#0A1929',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#38BDF8',

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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  '3xl': 32,
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
