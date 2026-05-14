/**
 * BottomTabBar — Premium bottom navigation
 * Clean minimal tabs with subtle active indicator.
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../design/ThemeContext';
import { spacing, radii, typography } from '../../design/tokens';

interface Tab {
  key: string;
  label: string;
  icon: string;
  activeIcon: string;
}

const TABS: Tab[] = [
  { key: 'home', label: 'Home', icon: '🏠', activeIcon: '🏠' },
  { key: 'camera', label: 'Camera', icon: '📷', activeIcon: '📷' },
  { key: 'viewer', label: 'Viewer', icon: '👁️', activeIcon: '👁️' },
  { key: 'recordings', label: 'Clips', icon: '🎬', activeIcon: '🎬' },
  { key: 'settings', label: 'Settings', icon: '⚙️', activeIcon: '⚙️' },
];

interface BottomTabBarProps {
  activeTab: string;
  onTabPress: (key: string) => void;
}

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.nav.background,
          borderTopColor: theme.nav.border,
          paddingBottom: Math.max(insets.bottom, spacing['2']),
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onTabPress(tab.key)}
            style={styles.tab}
          >
            <View
              style={[
                styles.iconWrapper,
                isActive && {
                  backgroundColor: theme.accent.primaryMuted,
                },
              ]}
            >
              <Text style={{ fontSize: 20 }}>
                {isActive ? tab.activeIcon : tab.icon}
              </Text>
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? theme.nav.active : theme.nav.inactive,
                  fontFamily: isActive
                    ? typography.fontFamily.semibold
                    : typography.fontFamily.regular,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingTop: spacing['2'],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: spacing['0.5'],
  },
  iconWrapper: {
    width: 42,
    height: 28,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
