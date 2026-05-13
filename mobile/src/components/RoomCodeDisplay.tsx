/**
 * RoomCodeDisplay Component
 * Shows room code with copy functionality and QR code
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { GlassCard } from './GlassCard';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../constants/theme';

interface RoomCodeDisplayProps {
  roomCode: string;
  showQR?: boolean;
}

export function RoomCodeDisplay({ roomCode, showQR = true }: RoomCodeDisplayProps) {
  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(roomCode);
      Alert.alert('Copied!', 'Room code copied to clipboard');
    } catch {
      Alert.alert('Room Code', roomCode);
    }
  }, [roomCode]);

  return (
    <GlassCard variant="accent" style={styles.container}>
      <Text style={styles.label}>Room Code</Text>

      <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
        <View style={styles.codeContainer}>
          {roomCode.split('').map((char, index) => (
            <View key={index} style={styles.charBox}>
              <Text style={styles.char}>{char}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
        <Text style={styles.copyText}>📋 Tap to Copy</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Share this code with viewers to connect
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  codeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  charBox: {
    width: 44,
    height: 52,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  char: {
    color: colors.accent.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    fontFamily: 'monospace',
  },
  copyButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: spacing.sm,
  },
  copyText: {
    color: colors.accent.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  hint: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});
