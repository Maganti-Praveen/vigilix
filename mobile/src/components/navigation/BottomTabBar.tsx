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

import { Home, Camera, Eye, Film, Settings } from 'lucide-react-native';

interface Tab {
  key: string;
  label: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const TABS: Tab[] = [
  { key: 'home', label: 'Home', IconComponent: Home },
  { key: 'camera', label: 'Camera', IconComponent: Camera },
  { key: 'viewer', label: 'Viewer', IconComponent: Eye },
  { key: 'recordings', label: 'Clips', IconComponent: Film },
  { key: 'settings', label: 'Settings', IconComponent: Settings },
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
        styles.dockWrapper,
        {
          bottom: Math.max(insets.bottom + 6, 14),
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.dock,
          {
            backgroundColor: theme.mode === 'light' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(17, 19, 24, 0.90)',
            borderColor: theme.border.primary,
          },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.IconComponent;
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
                <Icon
                  size={18}
                  color={isActive ? theme.accent.primary : theme.text.secondary}
                  strokeWidth={isActive ? 2.3 : 1.9}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? theme.text.primary : theme.text.secondary,
                    fontFamily: isActive
                      ? typography.fontFamily.semibold
                      : typography.fontFamily.medium,
                    fontWeight: isActive ? '600' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 100,
  },
  dock: {
    width: '100%',
    maxWidth: 420,
    height: 58,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  iconWrapper: {
    width: 32,
    height: 26,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 9.5,
    letterSpacing: 0.1,
  },
});
