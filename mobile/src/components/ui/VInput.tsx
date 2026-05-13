/**
 * VInput — Clean themed text input
 */

import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../design/ThemeContext';
import { spacing, radii, typography } from '../../design/tokens';

interface VInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function VInput({ label, error, style, ...props }: VInputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>
      )}
      <TextInput
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        placeholderTextColor={theme.text.tertiary}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface.input,
            borderColor: focused ? theme.surface.inputFocus : theme.surface.inputBorder,
            color: theme.text.primary,
          },
          error && { borderColor: theme.status.danger },
          style,
        ]}
      />
      {error && (
        <Text style={[styles.error, { color: theme.status.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing['1.5'],
  },
  label: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing['1'],
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radii.xl,
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['4'],
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.medium,
  },
  error: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing['1'],
  },
});
