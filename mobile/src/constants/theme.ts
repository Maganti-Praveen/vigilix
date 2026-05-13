/**
 * Dark theme color palette
 * Modern, sleek colors for the CCTV application
 */
export const colors = {
  // Backgrounds
  bg: {
    primary: '#0A0E1A',      // Deep dark blue-black
    secondary: '#111827',     // Slightly lighter dark
    tertiary: '#1F2937',      // Card backgrounds
    elevated: '#252D3D',      // Elevated elements
    glass: 'rgba(17, 24, 39, 0.85)', // Glassmorphism
  },

  // Accent colors
  accent: {
    primary: '#3B82F6',       // Bright blue
    secondary: '#8B5CF6',     // Purple
    success: '#10B981',       // Emerald green
    warning: '#F59E0B',       // Amber
    danger: '#EF4444',        // Red
    info: '#06B6D4',          // Cyan
  },

  // Gradient pairs
  gradient: {
    primary: ['#3B82F6', '#8B5CF6'],     // Blue → Purple
    success: ['#10B981', '#059669'],       // Green shades
    danger: ['#EF4444', '#DC2626'],        // Red shades
    warm: ['#F59E0B', '#EF4444'],          // Amber → Red
    cool: ['#06B6D4', '#3B82F6'],          // Cyan → Blue
  },

  // Text colors
  text: {
    primary: '#F9FAFB',       // White-ish
    secondary: '#9CA3AF',     // Gray
    tertiary: '#6B7280',      // Dim gray
    accent: '#3B82F6',        // Blue
    muted: '#4B5563',         // Muted
  },

  // Border colors
  border: {
    primary: '#374151',       // Subtle border
    secondary: '#4B5563',     // Visible border
    accent: '#3B82F6',        // Accent border
    glow: 'rgba(59, 130, 246, 0.3)', // Glow effect
  },

  // Status colors
  status: {
    online: '#10B981',
    offline: '#EF4444',
    streaming: '#3B82F6',
    recording: '#EF4444',
    connecting: '#F59E0B',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
