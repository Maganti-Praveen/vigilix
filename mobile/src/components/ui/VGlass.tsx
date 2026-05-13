/**
 * VGlass — Frosted glass panel for floating overlays
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../design/ThemeContext';
import { radii, spacing } from '../../design/tokens';

interface VGlassProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  radius?: number;
}

export function VGlass({
  children, style, intensity = 24, radius = radii['2xl'],
}: VGlassProps) {
  const { isDark, theme } = useTheme();

  return (
    <View style={[styles.outer, { borderRadius: radius }, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blur,
          {
            borderRadius: radius,
            borderWidth: 1,
            borderColor: isDark
              ? 'rgba(148, 163, 184, 0.08)'
              : 'rgba(255, 255, 255, 0.3)',
          },
        ]}
      >
        <View style={[styles.inner, { borderRadius: radius }]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
  blur: {
    overflow: 'hidden',
  },
  inner: {
    padding: spacing['4'],
  },
});
