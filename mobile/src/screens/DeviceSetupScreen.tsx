/**
 * DeviceSetupScreen — Vigilix
 * First-time device registration matching reference HTML:
 * Select Camera vs Viewer role, detected model info, and dynamic CTA.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import { ArrowLeft, Video, Eye, Smartphone, Check } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../design/ThemeContext';
import { VButton } from '../components/ui';
import { radii, spacing, typography } from '../design/tokens';
import fcmService from '../services/fcmService';

interface DeviceSetupScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

export default function DeviceSetupScreen({ onComplete, onBack }: DeviceSetupScreenProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { registerDevice } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<'camera' | 'viewer'>('camera');
  const [isRegistering, setIsRegistering] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const deviceModel = Device.modelName || Device.deviceName || 'Android Device';
  const deviceName = `${deviceModel}`;

  // Initialize FCM on mount
  useEffect(() => {
    fcmService.initialize()
      .then((token) => {
        if (token) setFcmToken(token);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsRegistering(true);
    try {
      const name = selectedRole === 'camera'
        ? `${deviceName} Camera`
        : `${deviceName} Viewer`;

      const device = await registerDevice(name, deviceModel, selectedRole, fcmToken || undefined);

      if (device) {
        onComplete();
      } else {
        Alert.alert('Registration Failed', 'Failed to register device. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 10, 24),
            paddingBottom: Math.max(insets.bottom + 20, 28),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header matching reference */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.kicker, { color: theme.text.secondary }]}>
              FIRST-TIME SETUP
            </Text>
            <Text style={[styles.screenTitle, { color: theme.text.primary }]}>
              Configure device
            </Text>
          </View>

          {onBack && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBack}
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <ArrowLeft size={16} color={theme.text.primary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
          Choose how this phone will participate in your private surveillance network.
        </Text>

        {/* 2 Interactive Role Cards */}
        <View style={styles.roleCardsGroup}>
          {/* Camera Role Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSelectedRole('camera')}
            style={[
              styles.roleCard,
              {
                backgroundColor: theme.surface.card,
                borderColor: selectedRole === 'camera' ? theme.accent.primary : theme.border.primary,
              },
              selectedRole === 'camera' && {
                borderWidth: 1.5,
                shadowColor: theme.accent.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.16,
                shadowRadius: 16,
                elevation: 4,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWrap}>
                <View
                  style={[
                    styles.roleIconWrap,
                    {
                      backgroundColor: selectedRole === 'camera'
                        ? theme.accent.primaryMuted
                        : theme.surface.surface2,
                    },
                  ]}
                >
                  <Video
                    size={16}
                    color={selectedRole === 'camera' ? theme.accent.primary : theme.text.secondary}
                  />
                </View>
                <View>
                  <Text style={[styles.roleTitle, { color: theme.text.primary }]}>
                    Camera device
                  </Text>
                  <Text style={[styles.roleSubtitle, { color: theme.text.secondary }]}>
                    Stationary unit streaming video & audio
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: theme.surface.surface2,
                    borderColor: theme.border.primary,
                  },
                ]}
              >
                <View style={[styles.badgeDot, { backgroundColor: theme.status.success }]} />
                <Text style={[styles.badgeText, { color: theme.text.secondary }]}>
                  Stationary
                </Text>
              </View>
            </View>

            <Text style={[styles.cardDescription, { color: theme.text.secondary }]}>
              Optimized for persistent power, high efficiency encoding, low screen brightness, and remote wake.
            </Text>
          </TouchableOpacity>

          {/* Viewer Role Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSelectedRole('viewer')}
            style={[
              styles.roleCard,
              {
                backgroundColor: theme.surface.card,
                borderColor: selectedRole === 'viewer' ? theme.accent.primary : theme.border.primary,
              },
              selectedRole === 'viewer' && {
                borderWidth: 1.5,
                shadowColor: theme.accent.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.16,
                shadowRadius: 16,
                elevation: 4,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWrap}>
                <View
                  style={[
                    styles.roleIconWrap,
                    {
                      backgroundColor: selectedRole === 'viewer'
                        ? theme.accent.primaryMuted
                        : theme.surface.surface2,
                    },
                  ]}
                >
                  <Eye
                    size={16}
                    color={selectedRole === 'viewer' ? theme.accent.primary : theme.text.secondary}
                  />
                </View>
                <View>
                  <Text style={[styles.roleTitle, { color: theme.text.primary }]}>
                    Viewer device
                  </Text>
                  <Text style={[styles.roleSubtitle, { color: theme.text.secondary }]}>
                    Handheld monitor for viewing feeds
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: theme.surface.surface2,
                    borderColor: theme.border.primary,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.text.secondary }]}>
                  Handheld
                </Text>
              </View>
            </View>

            <Text style={[styles.cardDescription, { color: theme.text.secondary }]}>
              Provides low latency playback, push-to-talk audio, flashlight toggle, zoom and clip review.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Detected Device Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.surface.surface2,
              borderColor: theme.border.primary,
            },
          ]}
        >
          <View style={styles.deviceRow}>
            <View style={styles.deviceLabelWrap}>
              <Smartphone size={14} color={theme.text.secondary} />
              <Text style={[styles.deviceLabel, { color: theme.text.secondary }]}>
                Detected device
              </Text>
            </View>
            <View
              style={[
                styles.deviceModelPill,
                {
                  backgroundColor: theme.surface.card,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Text style={[styles.deviceModelText, { color: theme.text.primary }]}>
                {deviceModel}
              </Text>
            </View>
          </View>
        </View>

        {/* Dynamic CTA Button */}
        <View style={styles.ctaWrapper}>
          <VButton
            title={selectedRole === 'camera' ? 'Save and start camera' : 'Save and start viewer'}
            onPress={handleSave}
            variant="primary"
            size="lg"
            loading={isRegistering}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardsGroup: {
    gap: 12,
    marginBottom: 14,
  },
  roleCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  roleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  roleSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 11,
    lineHeight: 16,
  },
  infoCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  deviceModelPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  deviceModelText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  ctaWrapper: {
    marginTop: 4,
  },
});
