/**
 * StatusBadge Component
 * Animated status indicator with label
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../constants/theme';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'streaming' | 'recording' | 'connecting';
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'streaming' || status === 'recording' || status === 'connecting') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const dotColor = colors.status[status] || colors.status.offline;
  const dotSize = size === 'sm' ? 6 : 8;
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <View style={[styles.container, size === 'sm' && styles.containerSm]}>
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: dotColor,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            opacity: pulseAnim,
            shadowColor: dotColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 3,
          },
        ]}
      />
      <Text style={[styles.label, size === 'sm' && styles.labelSm]}>
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  containerSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    marginRight: spacing.sm,
  },
  label: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  labelSm: {
    fontSize: fontSize.xs,
  },
});
