/**
 * SettingsScreen — Vigilix
 * Clean, consumer-friendly settings with grouped cards.
 */

import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  TouchableOpacity, Switch, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../design/ThemeContext';
import { spacing, radii, typography } from '../design/tokens';
import { VCard } from '../components/ui/VCard';
import { VIconButton } from '../components/ui/VIconButton';
import { useFadeIn, useSlideUp } from '../design/animations';
import { Animated } from 'react-native';
import { useAuthStore } from '../store/authStore';
import updateService, { APP_VERSION } from '../services/updateService';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout?: () => void;
}

export function SettingsScreen({ onBack, onLogout }: SettingsScreenProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuthStore();
  const headerOpacity = useFadeIn(0);
  const contentAnim = useSlideUp(100, 20);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          onLogout?.();
        },
      },
    ]);
  }, [logout, onLogout]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <StatusBar barStyle={theme.statusBar} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <Text style={[styles.title, { color: theme.text.primary }]}>Settings</Text>
          </Animated.View>

          <Animated.View style={contentAnim}>
            {/* Appearance */}
            <Text style={[styles.sectionLabel, { color: theme.text.tertiary }]}>
              Appearance
            </Text>
            <VCard>
              <SettingRow
                icon="🌙"
                label="Dark Mode"
                right={
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#D1D5DB', true: theme.accent.primary }}
                    thumbColor="#FFF"
                  />
                }
              />
            </VCard>

            {/* Video */}
            <Text style={[styles.sectionLabel, { color: theme.text.tertiary }]}>
              Video Quality
            </Text>
            <VCard>
              <SettingRow icon="📹" label="Resolution" value="720p HD" />
              <Divider />
              <SettingRow icon="📊" label="Max Bitrate" value="Auto" />
              <Divider />
              <SettingRow icon="🎯" label="Frame Rate" value="30 fps" />
            </VCard>

            {/* Connection */}
            <Text style={[styles.sectionLabel, { color: theme.text.tertiary }]}>
              Connection
            </Text>
            <VCard>
              <SettingRow
                icon="🔄"
                label="Auto-Reconnect"
                right={
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: '#D1D5DB', true: theme.accent.primary }}
                    thumbColor="#FFF"
                  />
                }
              />
              <Divider />
              <SettingRow icon="📡" label="Server" value="Auto" />
            </VCard>

            {/* About */}
            <Text style={[styles.sectionLabel, { color: theme.text.tertiary }]}>
              About
            </Text>
            <VCard>
              <View style={styles.aboutHeader}>
                <Image
                  source={require('../../assets/vigilix-logo.png')}
                  style={styles.aboutLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={[styles.aboutName, { color: theme.text.primary }]}>Vigilix</Text>
                  <Text style={[styles.aboutVersion, { color: theme.text.tertiary }]}>
                    Version {APP_VERSION}
                  </Text>
                </View>
              </View>
              <Divider />
              <TouchableOpacity onPress={() => updateService.checkForUpdate(true)}>
                <SettingRow icon="🔄" label="Check for Updates" arrow />
              </TouchableOpacity>
              <Divider />
              <SettingRow icon="📜" label="Privacy Policy" arrow />
              <Divider />
              <SettingRow icon="📄" label="Terms of Service" arrow />
              <Divider />
              <SettingRow icon="💬" label="Send Feedback" arrow />
            </VCard>
          </Animated.View>

          {/* Account */}
          {isAuthenticated && (
            <Animated.View style={[{ marginBottom: spacing['6'] }, {
              opacity: contentAnim.opacity,
              transform: contentAnim.transform,
            }]}>
              <Text style={[styles.sectionLabel, { color: theme.text.tertiary }]}>
                Account
              </Text>
              <VCard>
                <View style={styles.aboutHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: theme.accent.primary }]}>
                    <Text style={styles.avatarText}>
                      {user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.aboutName, { color: theme.text.primary }]}>{user?.name}</Text>
                    <Text style={[styles.aboutVersion, { color: theme.text.tertiary }]}>{user?.email}</Text>
                  </View>
                </View>
                <Divider />
                <TouchableOpacity onPress={handleLogout}>
                  <SettingRow icon="🚪" label="Sign Out" arrow />
                </TouchableOpacity>
              </VCard>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Setting Row ─────────────────────────────────────────────────

function SettingRow({
  icon, label, value, right, arrow,
}: {
  icon: string; label: string; value?: string;
  right?: React.ReactNode; arrow?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={arrow ? 0.6 : 1}
      style={styles.settingRow}
      disabled={!arrow}
    >
      <View style={styles.settingLeft}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={[styles.settingLabel, { color: theme.text.primary }]}>{label}</Text>
      </View>
      {value && (
        <Text style={[styles.settingValue, { color: theme.text.tertiary }]}>{value}</Text>
      )}
      {right}
      {arrow && (
        <Text style={{ color: theme.text.tertiary, fontSize: 16 }}>›</Text>
      )}
    </TouchableOpacity>
  );
}

function Divider() {
  const { theme } = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border.primary }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: spacing['5'],
    paddingBottom: spacing['20'],
    gap: spacing['2'],
  },

  header: {
    marginBottom: spacing['4'],
    marginTop: spacing['2'],
  },
  title: {
    fontSize: typography.size['3xl'],
    fontFamily: typography.fontFamily.bold,
    letterSpacing: -0.5,
  },

  sectionLabel: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    marginTop: spacing['5'],
    marginBottom: spacing['2'],
    marginLeft: spacing['1'],
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing['3'],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
    flex: 1,
  },
  settingLabel: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.medium,
  },
  settingValue: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.regular,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing['10'],
  },

  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
    paddingVertical: spacing['2'],
  },
  aboutLogo: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
  },
  aboutName: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.bold,
  },
  aboutVersion: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.regular,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});
