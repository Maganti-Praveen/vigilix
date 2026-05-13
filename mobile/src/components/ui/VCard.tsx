/**
 * VCard — Premium surface card
 * Clean rounded card with subtle shadows and theme-aware styling.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../../design/ThemeContext';
import { spacing, radii, shadows } from '../../design/tokens';

interface VCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  animated?: Animated.WithAnimatedObject<ViewStyle>;
}

export function VCard({ children, style, variant = 'default', animated }: VCardProps) {
  const { theme } = useTheme();

  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? {
          backgroundColor: theme.surface.card,
          ...shadows.lg,
        }
      : variant === 'outlined'
      ? {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.border.primary,
        }
      : {
          backgroundColor: theme.surface.card,
          borderWidth: 1,
          borderColor: theme.surface.cardBorder,
          ...shadows.sm,
        };

  if (animated) {
    return (
      <Animated.View
        style={[styles.base, variantStyle, style, animated]}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <View style={[styles.base, variantStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii['2xl'],
    padding: spacing['5'],
    overflow: 'hidden',
  },
});
