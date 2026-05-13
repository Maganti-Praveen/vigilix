/**
 * VIconButton — Circular icon button for camera/viewer controls
 * Glassmorphic floating style for overlay usage.
 */

import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, View, Animated,
} from 'react-native';
import { useTheme } from '../../design/ThemeContext';
import { spacing, radii } from '../../design/tokens';
import { useScalePress } from '../../design/animations';

interface VIconButtonProps {
  icon: string;
  onPress: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  glass?: boolean;
}

export function VIconButton({
  icon, onPress, label, size = 'md',
  active, danger, disabled, glass,
}: VIconButtonProps) {
  const { theme, isDark } = useTheme();
  const { style: animStyle, pressProps } = useScalePress(0.9);

  const dim = size === 'sm' ? 40 : size === 'lg' ? 60 : 50;
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;

  return (
    <Animated.View style={[animStyle, styles.wrapper]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled}
        {...pressProps}
        style={[
          styles.button,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
          },
          glass && {
            backgroundColor: isDark
              ? 'rgba(11, 17, 33, 0.65)'
              : 'rgba(255, 255, 255, 0.65)',
            borderWidth: 1,
            borderColor: isDark
              ? 'rgba(148, 163, 184, 0.12)'
              : 'rgba(0, 0, 0, 0.06)',
          },
          !glass && {
            backgroundColor: active
              ? theme.accent.primaryMuted
              : theme.bg.tertiary,
          },
          active && !danger && {
            backgroundColor: theme.accent.primaryMuted,
            borderWidth: 1.5,
            borderColor: theme.accent.primary,
          },
          danger && {
            backgroundColor: 'rgba(248, 113, 113, 0.15)',
            borderWidth: 1.5,
            borderColor: theme.status.danger,
          },
          disabled && { opacity: 0.4 },
        ]}
      >
        <Text style={{ fontSize: iconSize }}>{icon}</Text>
      </TouchableOpacity>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: active
                ? theme.accent.primary
                : danger
                ? theme.status.danger
                : theme.text.tertiary,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing['1.5'],
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
