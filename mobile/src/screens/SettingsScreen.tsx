/**
 * SettingsScreen — Vigilix
 * Preferences and application configuration matching the visual reference design,
 * featuring interactive Light/Dark appearance segmented controls, video quality options,
 * real-time system connection badges, and account management.
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../design/ThemeContext';
import { spacing, radii, typography } from '../design/tokens';
import { VCard } from '../components/ui/VCard';
import { VButton } from '../components/ui/VButton';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import socketService from '../services/socketService';
import updateService, { APP_VERSION } from '../services/updateService';
import type { VideoQualityPreset } from '../types';
import {
  Sun, Moon, ChevronRight, RefreshCw, MoreHorizontal,
  Shield, Check, User,
} from 'lucide-react-native';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout?: () => void;
}

export function SettingsScreen({ onBack, onLogout }: SettingsScreenProps) {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { videoQuality, setVideoQuality, autoReconnect, setAutoReconnect } = useAppStore();
  const [followSystem, setFollowSystem] = useState(false);

  const qualityLabels: Record<VideoQualityPreset, string> = {
    low: '480p SD',
    medium: '720p HD',
    high: '1080p FHD',
  };

  const handleSelectResolution = useCallback(() => {
    Alert.alert(
      'Stream Resolution',
      'Select video streaming resolution for camera and viewer:',
      [
        { text: '480p SD (Low bandwidth)', onPress: () => setVideoQuality('low') },
        { text: '720p HD (Recommended)', onPress: () => setVideoQuality('medium') },
        { text: '1080p FHD (High fidelity)', onPress: () => setVideoQuality('high') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [setVideoQuality]);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from Vigilix?', [
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

  const isServerConnected = socketService.isConnected();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg.primary} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header (.top) */}
          <View style={styles.top}>
            <View>
              <Text style={[styles.kicker, { color: theme.accent.primary }]}>PREFERENCES</Text>
              <Text style={[styles.title, { color: theme.text.primary }]}>Settings</Text>
              <Text style={[styles.sub, { color: theme.text.secondary }]}>
                Vigilix · v{APP_VERSION}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.surface.card,
                  borderColor: theme.border.primary,
                },
              ]}
              onPress={() => updateService.checkForUpdate(true)}
              activeOpacity={0.7}
            >
              <MoreHorizontal size={18} color={theme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* 1. Appearance Block (.card.pad.settingBlock) */}
          <VCard style={styles.settingBlock}>
            <Text style={[styles.cardKicker, { color: theme.accent.primary }]}>APPEARANCE</Text>

            {/* Theme Row with Segmented Switch */}
            <View style={[styles.settingRow, { borderBottomColor: theme.border.primary }]}>
              <View style={styles.settingTextCol}>
                <Text style={[styles.smallTitle, { color: theme.text.primary }]}>Theme</Text>
                <Text style={[styles.tinyMuted, { color: theme.text.secondary }]}>
                  Light is the default. Dark follows your preference.
                </Text>
              </View>

              <View
                style={[
                  styles.appearanceSwitch,
                  {
                    borderColor: theme.border.primary,
                    backgroundColor: theme.surface.input,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.appearanceBtn,
                    themeMode === 'light' && [
                      styles.appearanceBtnSel,
                      {
                        backgroundColor: theme.surface.card,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 1,
                      },
                    ],
                  ]}
                  onPress={() => setThemeMode('light')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.appearanceText,
                      {
                        color: themeMode === 'light' ? theme.text.primary : theme.text.tertiary,
                        fontFamily: themeMode === 'light' ? typography.fontFamily.semibold : typography.fontFamily.medium,
                      },
                    ]}
                  >
                    Light
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.appearanceBtn,
                    themeMode === 'dark' && [
                      styles.appearanceBtnSel,
                      {
                        backgroundColor: theme.surface.card,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 1,
                      },
                    ],
                  ]}
                  onPress={() => setThemeMode('dark')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.appearanceText,
                      {
                        color: themeMode === 'dark' ? theme.text.primary : theme.text.tertiary,
                        fontFamily: themeMode === 'dark' ? typography.fontFamily.semibold : typography.fontFamily.medium,
                      },
                    ]}
                  >
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* System Appearance Row */}
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingTextCol}>
                <Text style={[styles.smallTitle, { color: theme.text.primary }]}>System appearance</Text>
                <Text style={[styles.tinyMuted, { color: theme.text.secondary }]}>
                  Use Vigilix's selected theme
                </Text>
              </View>

              <Switch
                value={followSystem}
                onValueChange={setFollowSystem}
                trackColor={{ false: theme.border.primary, true: theme.accent.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </VCard>

          {/* 2. Experience Block (.card.pad.settingBlock) */}
          <VCard style={styles.settingBlock}>
            <Text style={[styles.cardKicker, { color: theme.accent.primary }]}>EXPERIENCE</Text>

            {/* Resolution */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: theme.border.primary }]}
              onPress={handleSelectResolution}
              activeOpacity={0.7}
            >
              <View style={styles.settingTextCol}>
                <Text style={[styles.smallTitle, { color: theme.text.primary }]}>Resolution</Text>
                <Text style={[styles.tinyMuted, { color: theme.text.secondary }]}>
                  Video stream quality
                </Text>
              </View>

              <View
                style={[
                  styles.selectPill,
                  {
                    backgroundColor: theme.surface.input,
                    borderColor: theme.border.primary,
                  },
                ]}
              >
                <Text style={[styles.selectText, { color: theme.text.primary }]}>
                  {qualityLabels[videoQuality]}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Bitrate */}
            <View style={[styles.settingRow, { borderBottomColor: theme.border.primary }]}>
              <View style={styles.settingTextCol}>
                <Text style={[styles.smallTitle, { color: theme.text.primary }]}>Bitrate</Text>
                <Text style={[styles.tinyMuted, { color: theme.text.secondary }]}>
                  Adaptive
                </Text>
              </View>

              <View
                style={[
                  styles.selectPill,
                  {
                    backgroundColor: theme.surface.input,
                    borderColor: theme.border.primary,
                  },
                ]}
              >
                <Text style={[styles.selectText, { color: theme.text.primary }]}>Auto</Text>
              </View>
            </View>

            {/* Frame rate */}
            <View style={[styles.settingRow, { borderBottomColor: theme.border.primary }]}>
              <View style={styles.settingTextCol}>
                <Text style={[styles.smallTitle, { color: theme.text.primary }]}>Frame rate</Text>
                <Text style={[styles.tinyMuted, { color: theme.text.secondary }]}>
                  Target frame rate
                </Text>
              </View>

              <View
                style={[
                  styles.selectPill,
                  {
                    backgroundColor: theme.surface.input,
                    borderColor: theme.border.primary,
                  },
                ]}
              >
                <Text style={[styles.selectText, { color: theme.text.primary }]}>30 fps</Text>
              </View>
            </View>

            {/* Auto reconnect */}
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingTextCol}>
                <Text style={[styles.smallTitle, { color: theme.text.primary }]}>Auto reconnect</Text>
                <Text style={[styles.tinyMuted, { color: theme.text.secondary }]}>
                  Recover from short network drops
                </Text>
              </View>

              <Switch
                value={autoReconnect}
                onValueChange={setAutoReconnect}
                trackColor={{ false: theme.border.primary, true: theme.accent.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </VCard>

          {/* 3. System Block (.card.pad.settingBlock) */}
          <VCard style={styles.settingBlock}>
            <Text style={[styles.cardKicker, { color: theme.accent.primary }]}>SYSTEM</Text>

            {/* Server connection */}
            <View style={[styles.settingRow, { borderBottomColor: theme.border.primary }]}>
              <Text style={[styles.smallTitle, { color: theme.text.primary }]}>Server connection</Text>
              <View style={styles.badgePill}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isServerConnected ? theme.status.success : theme.status.warning },
                  ]}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: isServerConnected ? theme.status.success : theme.status.warning },
                  ]}
                >
                  {isServerConnected ? 'Connected' : 'Offline'}
                </Text>
              </View>
            </View>

            {/* Background streaming */}
            <View style={[styles.settingRow, { borderBottomColor: theme.border.primary }]}>
              <Text style={[styles.smallTitle, { color: theme.text.primary }]}>Background streaming</Text>
              <View style={styles.badgePill}>
                <Text style={[styles.badgeText, { color: theme.text.secondary }]}>Enabled</Text>
              </View>
            </View>

            {/* Push-to-wake */}
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.smallTitle, { color: theme.text.primary }]}>Push-to-wake</Text>
              <View style={styles.badgePill}>
                <Text style={[styles.badgeText, { color: theme.text.secondary }]}>Enabled</Text>
              </View>
            </View>
          </VCard>

          {/* 4. Account Profile Info (if authenticated) */}
          {isAuthenticated && user && (
            <VCard style={styles.settingBlock}>
              <Text style={[styles.cardKicker, { color: theme.accent.primary }]}>ACCOUNT</Text>
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.accountRow}>
                  <View style={[styles.avatar, { backgroundColor: theme.accent.primary }]}>
                    <Text style={styles.avatarText}>
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.accountName, { color: theme.text.primary }]}>{user.name}</Text>
                    <Text style={[styles.accountEmail, { color: theme.text.secondary }]}>{user.email}</Text>
                  </View>
                </View>
              </View>
            </VCard>
          )}

          {/* 5. Sign Out Button (.danger in reference HTML) */}
          <View style={{ marginTop: 14 }}>
            <VButton
              title="Sign out"
              variant="danger"
              size="lg"
              fullWidth
              onPress={handleLogout}
            />
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing['5'],
    paddingTop: spacing['3'],
  },

  // Top (.top)
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  kicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  sub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 3,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Setting block (.settingBlock)
  settingBlock: {
    marginTop: 10,
    padding: 14,
  },
  cardKicker: {
    fontSize: 9,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  settingTextCol: {
    flex: 1,
  },
  smallTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
  tinyMuted: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    marginTop: 3,
    lineHeight: 14,
  },

  // Appearance switch (.appearanceSwitch)
  appearanceSwitch: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  appearanceBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  appearanceBtnSel: {
    // Styling handled via background + shadow
  },
  appearanceText: {
    fontSize: 11,
  },

  // Select pill (.select)
  selectPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
  },

  // Badge pill
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
  },

  // Account
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
  accountName: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semibold,
  },
  accountEmail: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
});
