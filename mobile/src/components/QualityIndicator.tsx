/**
 * QualityIndicator Component
 * Visual stream quality indicator with signal bars
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../constants/theme';
import type { StreamQuality } from '../types';

interface QualityIndicatorProps {
  quality: StreamQuality;
  showLabel?: boolean;
}

const qualityConfig = {
  excellent: { bars: 4, color: colors.accent.success, label: 'Excellent' },
  good: { bars: 3, color: colors.accent.primary, label: 'Good' },
  weak: { bars: 2, color: colors.accent.warning, label: 'Weak' },
  reconnecting: { bars: 1, color: colors.accent.danger, label: 'Reconnecting' },
};

export function QualityIndicator({ quality, showLabel = true }: QualityIndicatorProps) {
  const config = qualityConfig[quality];

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.bar,
              {
                height: 4 + level * 4,
                backgroundColor: level <= config.bars ? config.color : 'rgba(255, 255, 255, 0.1)',
              },
            ]}
          />
        ))}
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.primary,
    gap: spacing.xs,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 4,
    borderRadius: 1,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginLeft: 2,
  },
});
