/**
 * Vigilix Theme Definitions
 * Light + Dark theme objects with semantic color mapping.
 *
 * Every component references theme colors, never raw palette values.
 */

import { palette } from './tokens';

export interface VigilixTheme {
  mode: 'light' | 'dark';

  // Backgrounds
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    inverse: string;
  };

  // Text
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    accent: string;
  };

  // Accent
  accent: {
    primary: string;
    primaryMuted: string;
    secondary: string;
    secondaryMuted: string;
  };

  // Borders
  border: {
    primary: string;
    secondary: string;
    accent: string;
  };

  // Status
  status: {
    success: string;
    warning: string;
    danger: string;
    info: string;
    live: string;
  };

  // Surfaces (cards, panels)
  surface: {
    card: string;
    cardBorder: string;
    glass: string;
    glassBorder: string;
    input: string;
    inputBorder: string;
    inputFocus: string;
  };

  // Specific UI
  nav: {
    background: string;
    border: string;
    active: string;
    inactive: string;
  };

  // Gradients
  gradient: {
    primary: [string, string];
    accent: [string, string];
    surface: [string, string];
    splash: [string, string, string];
  };

  // Status bar
  statusBar: 'light-content' | 'dark-content';
}

// ─── Light Theme ─────────────────────────────────────────────────

export const lightTheme: VigilixTheme = {
  mode: 'light',

  bg: {
    primary: '#FAFAF9',        // warm off-white
    secondary: '#F5F5F4',      // subtle warm gray
    tertiary: '#EEEEEC',
    elevated: palette.white,
    inverse: palette.navy950,
  },

  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: palette.white,
    accent: palette.blue500,
  },

  accent: {
    primary: palette.blue500,
    primaryMuted: 'rgba(79, 142, 247, 0.12)',
    secondary: palette.teal500,
    secondaryMuted: 'rgba(20, 184, 166, 0.10)',
  },

  border: {
    primary: '#E5E5E3',
    secondary: '#D4D4D2',
    accent: palette.blue200,
  },

  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    live: '#EF4444',
  },

  surface: {
    card: palette.white,
    cardBorder: '#F0F0EE',
    glass: 'rgba(255, 255, 255, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    input: '#F5F5F4',
    inputBorder: '#E5E5E3',
    inputFocus: palette.blue500,
  },

  nav: {
    background: 'rgba(250, 250, 249, 0.88)',
    border: '#E5E5E3',
    active: palette.blue500,
    inactive: '#9CA3AF',
  },

  gradient: {
    primary: [palette.blue500, palette.blue600],
    accent: [palette.blue400, palette.teal400],
    surface: ['#FAFAF9', '#F5F5F4'],
    splash: [palette.navy900, palette.navy950, '#060F1D'],
  },

  statusBar: 'dark-content',
};

// ─── Dark Theme ──────────────────────────────────────────────────

export const darkTheme: VigilixTheme = {
  mode: 'dark',

  bg: {
    primary: '#0B1121',         // deep elegant navy
    secondary: '#0F1729',       // slightly lighter
    tertiary: '#152036',
    elevated: '#1A2744',
    inverse: palette.white,
  },

  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    inverse: '#1A1A1A',
    accent: '#60A5FA',
  },

  accent: {
    primary: '#60A5FA',        // slightly lighter blue for dark mode
    primaryMuted: 'rgba(96, 165, 250, 0.15)',
    secondary: '#2DD4BF',
    secondaryMuted: 'rgba(45, 212, 191, 0.12)',
  },

  border: {
    primary: 'rgba(148, 163, 184, 0.12)',
    secondary: 'rgba(148, 163, 184, 0.20)',
    accent: 'rgba(96, 165, 250, 0.30)',
  },

  status: {
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#60A5FA',
    live: '#F87171',
  },

  surface: {
    card: 'rgba(15, 23, 42, 0.60)',
    cardBorder: 'rgba(148, 163, 184, 0.08)',
    glass: 'rgba(11, 17, 33, 0.75)',
    glassBorder: 'rgba(148, 163, 184, 0.06)',
    input: 'rgba(30, 41, 59, 0.50)',
    inputBorder: 'rgba(148, 163, 184, 0.15)',
    inputFocus: '#60A5FA',
  },

  nav: {
    background: 'rgba(11, 17, 33, 0.92)',
    border: 'rgba(148, 163, 184, 0.08)',
    active: '#60A5FA',
    inactive: '#64748B',
  },

  gradient: {
    primary: ['#3B82F6', '#2563EB'],
    accent: ['#60A5FA', '#2DD4BF'],
    surface: ['#0B1121', '#0F1729'],
    splash: ['#060F1D', '#0B1121', '#101B33'],
  },

  statusBar: 'light-content',
};
