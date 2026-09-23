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
    surface2: string;
  };

  // Specific UI
  nav: {
    background: string;
    border: string;
    active: string;
    inactive: string;
  };

  // HUD (Camera/Viewer streaming overlays)
  hud: {
    background: string;
    dock: string;
    border: string;
    text: string;
    muted: string;
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

// ─── Light Theme (DEFAULT) ───────────────────────────────────────

export const lightTheme: VigilixTheme = {
  mode: 'light',

  bg: {
    primary: '#F5F6F8',
    secondary: '#FFFFFF',
    tertiary: '#EAECEF',
    elevated: '#FFFFFF',
    inverse: '#0A0B0D',
  },

  text: {
    primary: '#111318',
    secondary: '#707782',
    tertiary: '#949BA6',
    inverse: '#FFFFFF',
    accent: '#3976FF',
  },

  accent: {
    primary: '#3976FF',
    primaryMuted: 'rgba(57, 118, 255, 0.12)',
    secondary: '#6A98FF',
    secondaryMuted: 'rgba(106, 152, 255, 0.12)',
  },

  border: {
    primary: 'rgba(18, 23, 31, 0.09)',
    secondary: 'rgba(18, 23, 31, 0.14)',
    accent: 'rgba(57, 118, 255, 0.35)',
  },

  status: {
    success: '#22A46A',
    warning: '#AD7A14',
    danger: '#D9555E',
    info: '#3976FF',
    live: '#D9555E',
  },

  surface: {
    card: '#FFFFFF',
    cardBorder: 'rgba(18, 23, 31, 0.09)',
    glass: 'rgba(255, 255, 255, 0.78)',
    glassBorder: 'rgba(18, 23, 31, 0.09)',
    input: '#FFFFFF',
    inputBorder: 'rgba(18, 23, 31, 0.12)',
    inputFocus: '#3976FF',
    surface2: 'rgba(255, 255, 255, 0.94)',
  },

  nav: {
    background: 'rgba(255, 255, 255, 0.92)',
    border: 'rgba(18, 23, 31, 0.09)',
    active: '#3976FF',
    inactive: '#707782',
  },

  hud: {
    background: 'rgba(4, 8, 13, 0.62)',
    dock: 'rgba(6, 9, 14, 0.75)',
    border: 'rgba(255, 255, 255, 0.12)',
    text: '#F5F6F8',
    muted: '#9299A3',
  },

  gradient: {
    primary: ['#6A98FF', '#3976FF'],
    accent: ['#6A98FF', '#3976FF'],
    surface: ['#FFFFFF', '#F5F6F8'],
    splash: ['#FFFFFF', '#F5F6F8', '#EAECEF'],
  },

  statusBar: 'dark-content',
};

// ─── Dark Theme ──────────────────────────────────────────────────

export const darkTheme: VigilixTheme = {
  mode: 'dark',

  bg: {
    primary: '#0A0B0D',
    secondary: '#111318',
    tertiary: '#171920',
    elevated: '#171920',
    inverse: '#F4F5F7',
  },

  text: {
    primary: '#F4F5F7',
    secondary: '#9299A3',
    tertiary: '#5D6470',
    inverse: '#111318',
    accent: '#6F9CFF',
  },

  accent: {
    primary: '#6F9CFF',
    primaryMuted: 'rgba(111, 156, 255, 0.15)',
    secondary: '#91B4FF',
    secondaryMuted: 'rgba(145, 180, 255, 0.12)',
  },

  border: {
    primary: 'rgba(255, 255, 255, 0.095)',
    secondary: 'rgba(255, 255, 255, 0.16)',
    accent: 'rgba(111, 156, 255, 0.35)',
  },

  status: {
    success: '#56D493',
    warning: '#EFBF62',
    danger: '#FF6F74',
    info: '#6F9CFF',
    live: '#FF6F74',
  },

  surface: {
    card: 'rgba(255, 255, 255, 0.055)',
    cardBorder: 'rgba(255, 255, 255, 0.095)',
    glass: 'rgba(17, 19, 24, 0.82)',
    glassBorder: 'rgba(255, 255, 255, 0.095)',
    input: 'rgba(255, 255, 255, 0.06)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    inputFocus: '#6F9CFF',
    surface2: 'rgba(255, 255, 255, 0.085)',
  },

  nav: {
    background: 'rgba(17, 19, 24, 0.90)',
    border: 'rgba(255, 255, 255, 0.095)',
    active: '#6F9CFF',
    inactive: '#9299A3',
  },

  hud: {
    background: 'rgba(4, 8, 13, 0.62)',
    dock: 'rgba(6, 9, 14, 0.75)',
    border: 'rgba(255, 255, 255, 0.12)',
    text: '#F5F6F8',
    muted: '#9299A3',
  },

  gradient: {
    primary: ['#91B4FF', '#6F9CFF'],
    accent: ['#91B4FF', '#6F9CFF'],
    surface: ['#111318', '#0A0B0D'],
    splash: ['#0A0B0D', '#111318', '#171920'],
  },

  statusBar: 'light-content',
};
