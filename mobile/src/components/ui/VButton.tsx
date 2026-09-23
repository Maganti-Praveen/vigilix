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
  icon?: React.ReactNode;
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
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? theme.accent.primary : '#FFF'}
        />
      ) : (
        <>
          {React.isValidElement(icon) ? (
            <View style={{ marginRight: spacing['2'] }}>{icon}</View>
          ) : typeof icon === 'string' ? (
            <Text style={[styles.icon, { fontSize: sizeStyle.fontSize }]}>{icon}</Text>
          ) : null}
          <Text
            style={[
              styles.label,
              { fontSize: sizeStyle.fontSize },
              variant === 'ghost' && { color: theme.text.primary },
              variant === 'secondary' && { color: theme.accent.primary },
              variant === 'danger' && { color: theme.status.danger },
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
            backgroundColor: theme.surface.surface2,
            borderWidth: 1,
            borderColor: theme.border.primary,
          },
          variant === 'danger' && {
            backgroundColor: 'rgba(217, 85, 94, 0.12)',
            borderWidth: 1,
            borderColor: 'rgba(217, 85, 94, 0.25)',
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
    paddingHorizontal: spacing['3'],
    borderRadius: radii.input,
    fontSize: typography.size.sm,
  },
  md: {
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['4'],
    borderRadius: radii.input,
    fontSize: typography.size.md,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: spacing['5'],
    borderRadius: radii.input,
    fontSize: typography.size.base,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.input,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
    letterSpacing: typography.letterSpacing.normal,
  },
  icon: {
    marginRight: spacing['1'],
  },
  disabled: {
    opacity: 0.45,
  },
});
