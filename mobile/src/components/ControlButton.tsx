/**
 * ControlButton Component
 * Circular icon button for camera/viewer controls
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '../constants/theme';

interface ControlButtonProps {
  icon: string;
  label?: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

export function ControlButton({
  icon,
  label,
  onPress,
  active = false,
  danger = false,
  size = 'md',
  disabled = false,
  style,
}: ControlButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
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

  const sizeConfig = {
    sm: { button: 40, icon: 16, label: fontSize.xs },
    md: { button: 52, icon: 20, label: fontSize.xs },
    lg: { button: 64, icon: 24, label: fontSize.sm },
  };

  const config = sizeConfig[size];

  const buttonBg = danger
    ? active
      ? colors.accent.danger
      : 'rgba(239, 68, 68, 0.15)'
    : active
    ? colors.accent.primary
    : 'rgba(255, 255, 255, 0.08)';

  const borderColor = danger
    ? active
      ? colors.accent.danger
      : 'rgba(239, 68, 68, 0.3)'
    : active
    ? colors.accent.primary
    : 'rgba(255, 255, 255, 0.12)';

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={0.8}
          style={[
            styles.button,
            {
              width: config.button,
              height: config.button,
              borderRadius: config.button / 2,
              backgroundColor: buttonBg,
              borderColor,
              opacity: disabled ? 0.4 : 1,
            },
          ]}
        >
          <Text style={[styles.icon, { fontSize: config.icon }]}>{icon}</Text>
        </TouchableOpacity>
      </Animated.View>
      {label && (
        <Text style={[styles.label, { fontSize: config.label }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  icon: {
    color: colors.text.primary,
  },
  label: {
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
