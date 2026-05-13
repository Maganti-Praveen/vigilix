/**
 * ActionButton Component
 * Large call-to-action button with gradient-like styling
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '../constants/theme';

interface ActionButtonProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function ActionButton({
  title,
  subtitle,
  icon,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const variantColors = {
    primary: {
      bg: colors.accent.primary,
      border: 'rgba(59, 130, 246, 0.5)',
      shadow: colors.accent.primary,
    },
    secondary: {
      bg: colors.bg.tertiary,
      border: colors.border.secondary,
      shadow: 'transparent',
    },
    danger: {
      bg: colors.accent.danger,
      border: 'rgba(239, 68, 68, 0.5)',
      shadow: colors.accent.danger,
    },
    success: {
      bg: colors.accent.success,
      border: 'rgba(16, 185, 129, 0.5)',
      shadow: colors.accent.success,
    },
  };

  const vc = variantColors[variant];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.button,
          size === 'lg' && styles.buttonLg,
          {
            backgroundColor: vc.bg,
            borderColor: vc.border,
            shadowColor: vc.shadow,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text.primary} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <View style={styles.textContainer}>
              <Text style={[styles.title, size === 'lg' && styles.titleLg]}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonLg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  titleLg: {
    fontSize: fontSize.xl,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    marginTop: 2,
    textAlign: 'center',
  },
});
