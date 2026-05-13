/**
 * GlassCard Component
 * Glassmorphism-styled card with blur effect
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'dark' | 'accent';
}

export function GlassCard({ children, style, variant = 'default' }: GlassCardProps) {
  return (
    <View style={[styles.card, variantStyles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.bg.glass,
    borderColor: colors.border.primary,
  },
  dark: {
    backgroundColor: 'rgba(10, 14, 26, 0.9)',
    borderColor: colors.border.primary,
  },
  accent: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: colors.border.glow,
  },
});
