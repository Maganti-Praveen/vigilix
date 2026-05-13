/**
 * VBadge — Status badge for LIVE, recording, quality, etc.
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../design/ThemeContext';
import { spacing, radii, typography } from '../../design/tokens';
import { usePulse } from '../../design/animations';

interface VBadgeProps {
  label: string;
  variant?: 'live' | 'recording' | 'success' | 'warning' | 'info' | 'default';
  pulse?: boolean;
  size?: 'sm' | 'md';
  icon?: string;
}

export function VBadge({ label, variant = 'default', pulse = false, size = 'sm', icon }: VBadgeProps) {
  const { theme } = useTheme();
  const pulseOpacity = usePulse(0.5);

  const colors = {
    live: { bg: 'rgba(239, 68, 68, 0.18)', text: '#F87171', dot: '#EF4444' },
    recording: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', dot: '#EF4444' },
    success: { bg: 'rgba(52, 211, 153, 0.15)', text: '#34D399', dot: '#10B981' },
    warning: { bg: 'rgba(251, 191, 36, 0.15)', text: '#FBBF24', dot: '#F59E0B' },
    info: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60A5FA', dot: '#3B82F6' },
    default: { bg: theme.bg.tertiary, text: theme.text.secondary, dot: theme.text.tertiary },
  };

  const c = colors[variant];
  const isSmall = size === 'sm';

  const dotElement = pulse ? (
    <Animated.View style={[styles.dot, { backgroundColor: c.dot, opacity: pulseOpacity }]} />
  ) : (
    <View style={[styles.dot, { backgroundColor: c.dot }]} />
  );

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? spacing['2'] : spacing['3'],
        },
      ]}
    >
      {(variant === 'live' || variant === 'recording') && dotElement}
      {icon && <Text style={{ fontSize: isSmall ? 10 : 12 }}>{icon}</Text>}
      <Text
        style={[
          styles.label,
          {
            color: c.text,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
