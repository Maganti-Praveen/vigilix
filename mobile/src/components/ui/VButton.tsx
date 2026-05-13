/**
 * VButton — Premium action button
 * Supports primary, secondary, ghost, danger variants.
 * Includes scale press animation.
 */

import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Animated, ActivityIndicator, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../design/ThemeContext';
import { spacing, radii, typography } from '../../design/tokens';
import { useScalePress } from '../../design/animations';

interface VButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function VButton({
  title, onPress, variant = 'primary', size = 'md',
  icon, loading, disabled, fullWidth,
}: VButtonProps) {
  const { theme } = useTheme();
  const { style: animStyle, pressProps } = useScalePress(0.97);

  const sizeStyle = sizes[size];
  const isDisabled = disabled || loading;

  const content = (
    <View style={[styles.inner, sizeStyle]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? theme.accent.primary : '#FFF'}
        />
      ) : (
        <>
          {icon && <Text style={[styles.icon, { fontSize: sizeStyle.fontSize }]}>{icon}</Text>}
          <Text
            style={[
              styles.label,
              { fontSize: sizeStyle.fontSize },
              variant === 'ghost' && { color: theme.accent.primary },
              variant === 'secondary' && { color: theme.accent.primary },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Animated.View style={[animStyle, fullWidth && { width: '100%' }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          disabled={isDisabled}
          {...pressProps}
        >
          <LinearGradient
            colors={theme.gradient.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.base,
              sizeStyle,
              isDisabled && styles.disabled,
            ]}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animStyle, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={isDisabled}
        {...pressProps}
        style={[
          styles.base,
          sizeStyle,
          variant === 'secondary' && {
            backgroundColor: theme.accent.primaryMuted,
            borderWidth: 1,
            borderColor: theme.border.accent,
          },
          variant === 'ghost' && {
            backgroundColor: 'transparent',
          },
          variant === 'danger' && {
            backgroundColor: theme.status.danger,
          },
          isDisabled && styles.disabled,
        ]}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
}

const sizes = {
  sm: {
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['4'],
    borderRadius: radii.lg,
    fontSize: typography.size.sm,
  },
  md: {
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['5'],
    borderRadius: radii.xl,
    fontSize: typography.size.md,
  },
  lg: {
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['6'],
    borderRadius: radii.xl,
    fontSize: typography.size.base,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
  },
  label: {
    color: '#FFF',
    fontFamily: typography.fontFamily.semibold,
    letterSpacing: typography.letterSpacing.wide,
  },
  icon: {
    marginRight: spacing['1'],
  },
  disabled: {
    opacity: 0.45,
  },
});
