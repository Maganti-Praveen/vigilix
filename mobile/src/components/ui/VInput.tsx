/**
 * VInput — Clean themed text input
 * Robust text input component optimized to prevent cursor jumping,
 * dropped keystrokes, and Android font-metric blinking.
 */

import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, Platform } from 'react-native';
import { useTheme } from '../../design/ThemeContext';
import { spacing, radii, typography } from '../../design/tokens';

interface VInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function VInput({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  secureTextEntry,
  ...props
}: VInputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface.input,
            borderColor: error
              ? theme.status.danger
              : focused
              ? theme.accent.primary
              : theme.border.primary,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          {...props}
          secureTextEntry={secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={theme.text.tertiary}
          style={[
            styles.input,
            {
              color: theme.text.primary,
              // On Android, avoid custom fontFamily on TextInputs (especially password fields)
              // to prevent Android ReactEditText from blinking, dropped keystrokes, and cursor jumping
              fontFamily: Platform.OS === 'ios' && !secureTextEntry ? typography.fontFamily.medium : undefined,
            },
            style,
          ]}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={[styles.error, { color: theme.status.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing['1'],
  },
  label: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    marginLeft: 2,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.input,
    paddingHorizontal: spacing['3'],
    minHeight: 46,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'android' ? 6 : 10,
    fontSize: 14,
  },
  iconLeft: {
    marginRight: spacing['2'],
  },
  iconRight: {
    marginLeft: spacing['2'],
  },
  error: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    marginLeft: 2,
    marginTop: 2,
  },
});
