/**
 * HomeScreen — Vigilix Dashboard
 * Matches reference HTML: Hero system status ("All clear."), 2-column quick action cards,
 * camera preview cards with live status & direct actions, and full theme support.
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Video,
  Radio,
  Eye,
  RefreshCw,
  Battery,
  Zap,
  Shield,
  ArrowRight,
  X,
} from 'lucide-react-native';
import { useTheme } from '../design/ThemeContext';
import { useAuthStore, Device } from '../store/authStore';
import { radii, spacing, typography } from '../design/tokens';
import { VButton } from '../components/ui';

interface HomeScreenProps {
  onSelectMode: (mode: 'camera' | 'viewer') => void;
  onConnectCamera?: (roomCode: string) => void;
}

export function HomeScreen({ onSelectMode, onConnectCamera }: HomeScreenProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, devices, loadDevices, isAuthenticated } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inputRoomCode, setInputRoomCode] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadDevices();
    }
  }, [isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  }, [loadDevices]);

  const cameras = devices.filter((d) => d.role === 'camera');
  const onlineCameras = cameras.filter((d) => d.isOnline);
  const avgBattery =
    cameras.length > 0
      ? Math.round(
          cameras.reduce((acc, c) => acc + (c.lastBatteryLevel ?? 80), 0) /
            cameras.length
        )
      : 84;

  const firstName = user?.name?.split(' ')[0] || 'User';

  const handleJoinWithCode = () => {
    const code = inputRoomCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Room Code Required', 'Please enter a camera room code.');
      return;
    }
    setJoinModalVisible(false);
    setInputRoomCode('');
    if (onConnectCamera) {
      onConnectCamera(code);
    } else {
      onSelectMode('viewer');
    }
  };

  const getDayAndContext = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return `${today} · Home`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
            paddingTop: Math.max(insets.top + 8, 20),
            paddingBottom: Math.max(insets.bottom + 85, 100), // clearance for floating dock
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent.primary}
          />
        }
      >
        {/* Top Header matching reference */}
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.kicker, { color: theme.text.secondary }]}>
              {getDayAndContext()}
            </Text>
            <Text style={[styles.greetingTitle, { color: theme.text.primary }]}>
              {getGreeting()}, {firstName}
            </Text>
            <Text style={[styles.greetingSub, { color: theme.text.secondary }]}>
              Your security system is ready.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRefresh}
            style={[
              styles.iconButton,
              {
                backgroundColor: theme.surface.surface2,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <RefreshCw size={16} color={theme.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Hero System Status Card */}
        <View
          style={[
            styles.heroStatCard,
            {
              backgroundColor: theme.surface.card,
              borderColor: theme.border.primary,
            },
          ]}
        >
          <View style={styles.heroRow}>
            <View>
              <Text style={[styles.statKicker, { color: theme.text.secondary }]}>
                SYSTEM STATUS
              </Text>
              <Text style={[styles.statBig, { color: theme.text.primary }]}>
                All clear.
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      onlineCameras.length > 0 ? theme.status.success : theme.text.tertiary,
                  },
                ]}
              />
              <Text style={[styles.badgeText, { color: theme.text.primary }]}>
                {onlineCameras.length > 0 ? `${onlineCameras.length} online` : 'Standby'}
              </Text>
            </View>
          </View>

          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View
              style={[
                styles.metricPill,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Text style={[styles.metricText, { color: theme.text.secondary }]}>
                {cameras.length} {cameras.length === 1 ? 'camera' : 'cameras'}
              </Text>
            </View>

            <View
              style={[
                styles.metricPill,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Text style={[styles.metricText, { color: theme.text.secondary }]}>
                P2P connected
              </Text>
            </View>

            <View
              style={[
                styles.metricPill,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Text style={[styles.metricText, { color: theme.text.secondary }]}>
                {avgBattery}% avg battery
              </Text>
            </View>
          </View>
        </View>

        {/* 2-Column Quick Action Cards matching reference */}
        <View style={styles.quickGrid}>
          {/* Start camera */}
          <View
            style={[
              styles.quickCard,
              {
                backgroundColor: theme.surface.card,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <View
              style={[
                styles.qicon,
                { backgroundColor: theme.accent.primaryMuted },
              ]}
            >
              <Video size={16} color={theme.accent.primary} />
            </View>
            <Text style={[styles.quickCardTitle, { color: theme.text.primary }]}>
              Start camera
            </Text>
            <Text style={[styles.quickCardDesc, { color: theme.text.secondary }]}>
              Broadcast this phone with your saved profile.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSelectMode('camera')}
              style={[
                styles.smallBtn,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Text style={[styles.smallBtnText, { color: theme.text.primary }]}>
                Start
              </Text>
            </TouchableOpacity>
          </View>

          {/* Join stream */}
          <View
            style={[
              styles.quickCard,
              {
                backgroundColor: theme.surface.card,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <View
              style={[
                styles.qicon,
                { backgroundColor: theme.accent.secondaryMuted },
              ]}
            >
              <Radio size={16} color={theme.accent.secondary} />
            </View>
            <Text style={[styles.quickCardTitle, { color: theme.text.primary }]}>
              Join stream
            </Text>
            <Text style={[styles.quickCardDesc, { color: theme.text.secondary }]}>
              Enter a room code to watch another camera.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setJoinModalVisible(true)}
              style={[
                styles.smallBtn,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Text style={[styles.smallBtnText, { color: theme.text.primary }]}>
                Enter code
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* "My cameras" section */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            My cameras
          </Text>
          <TouchableOpacity activeOpacity={0.6} onPress={onRefresh}>
            <Text style={[styles.linkText, { color: theme.accent.primary }]}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>

        {/* Camera List */}
        {cameras.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.surface.card,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconWrap,
                { backgroundColor: theme.accent.primaryMuted },
              ]}
            >
              <Video size={20} color={theme.accent.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
              No cameras registered yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
              Set up another phone as a Camera to start live monitoring.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSelectMode('camera')}
              style={styles.emptyAction}
            >
              <Text style={[styles.emptyActionText, { color: theme.accent.primary }]}>
                Use this phone as camera →
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraList}>
            {cameras.map((camera) => (
              <CameraCardItem
                key={camera._id}
                camera={camera}
                onWatch={() => {
                  if (camera.roomCode && onConnectCamera) {
                    onConnectCamera(camera.roomCode);
                  } else {
                    onSelectMode('viewer');
                  }
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Join Room Code Modal */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface.card,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                Enter Room Code
              </Text>
              <TouchableOpacity
                onPress={() => setJoinModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.text.secondary }]}>
              Enter the 4-character code displayed on the camera screen (e.g. XK92).
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.surface.input,
                  borderColor: theme.surface.inputBorder,
                  color: theme.text.primary,
                },
              ]}
              placeholder="ROOM CODE"
              placeholderTextColor={theme.text.tertiary}
              value={inputRoomCode}
              onChangeText={(text) => setInputRoomCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalCancelBtn,
                  {
                    backgroundColor: theme.surface.surface2,
                    borderColor: theme.border.primary,
                  },
                ]}
                onPress={() => setJoinModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.text.secondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <VButton
                title="Connect"
                onPress={handleJoinWithCode}
                variant="primary"
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Camera Card Item Component matching reference HTML ──────────────────────

function CameraCardItem({
  camera,
  onWatch,
}: {
  camera: Device;
  onWatch: () => void;
}) {
  const { theme, isDark } = useTheme();
  const [waking, setWaking] = useState(false);

  const handleWake = async () => {
    setWaking(true);
    try {
      const apiService = require('../services/apiService').default;
      await apiService.wakeDevice(camera._id);
      Alert.alert('Wake Signal Sent', 'The camera device has been notified to resume streaming.');
    } catch (err: any) {
      Alert.alert('Wake Failed', err.message || 'Could not wake camera device');
    } finally {
      setWaking(false);
    }
  };

  const isOnline = Boolean(camera.isOnline);
  const batteryLevel = camera.lastBatteryLevel ?? 84;

  return (
    <View
      style={[
        styles.camCard,
        {
          backgroundColor: theme.surface.card,
          borderColor: theme.border.primary,
        },
      ]}
    >
      {/* Video Thumbnail Placeholder */}
      <View
        style={[
          styles.camThumb,
          {
            backgroundColor: isDark ? '#0A0E14' : '#1D2736',
            borderColor: theme.border.primary,
          },
        ]}
      >
        {/* Subtle grid lines matching reference */}
        <View style={styles.thumbCrosshair} />

        {/* Live Status Badge */}
        <View
          style={[
            styles.thumbBadge,
            {
              backgroundColor: isOnline ? 'rgba(34, 164, 106, 0.22)' : 'rgba(0,0,0,0.5)',
              borderColor: isOnline ? 'rgba(34, 164, 106, 0.45)' : 'rgba(255,255,255,0.15)',
            },
          ]}
        >
          <View
            style={[
              styles.thumbDot,
              {
                backgroundColor: isOnline ? '#22A46A' : '#707782',
              },
            ]}
          />
          <Text style={[styles.thumbBadgeText, { color: '#FFFFFF' }]}>
            {isOnline ? 'Streaming' : 'Idle'}
          </Text>
        </View>

        {/* Center Camera Icon watermark */}
        <View style={styles.thumbWatermark}>
          <Video size={28} color="rgba(255, 255, 255, 0.15)" />
        </View>
      </View>

      {/* Info & Actions */}
      <View style={styles.camInfo}>
        <View style={styles.camHeaderRow}>
          <View>
            <Text style={[styles.camName, { color: theme.text.primary }]}>
              {camera.deviceName}
            </Text>
            <Text style={[styles.camSub, { color: theme.text.secondary }]}>
              {camera.roomCode ? `ROOM / ${camera.roomCode} · ` : ''}
              {batteryLevel}%
              {(camera as any).isCharging ? ' · Charging' : ''}
            </Text>
          </View>

          <View
            style={[
              styles.resBadge,
              {
                backgroundColor: theme.surface.surface2,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <Text style={[styles.resBadgeText, { color: theme.text.secondary }]}>
              720p
            </Text>
          </View>
        </View>

        {/* Cam Actions Row matching reference */}
        <View style={styles.camActions}>
          {isOnline ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onWatch}
              style={[
                styles.primaryMini,
                { backgroundColor: theme.accent.primary },
              ]}
            >
              <Text style={styles.primaryMiniText}>Watch live</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleWake}
              disabled={waking}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Text style={[styles.actionBtnText, { color: theme.text.primary }]}>
                {waking ? 'Waking...' : 'Wake camera'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                camera.deviceName,
                `Model: ${camera.deviceModel}\nStatus: ${isOnline ? 'Online' : 'Offline'}\nRoom: ${camera.roomCode || 'None'}\nBattery: ${batteryLevel}%`
              );
            }}
            style={[
              styles.actionBtn,
              {
                backgroundColor: theme.surface.surface2,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <Text style={[styles.actionBtnText, { color: theme.text.primary }]}>
              Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  greetingSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statKicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.1,
  },
  statBig: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 7,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  metricPill: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  metricText: {
    fontSize: 9.5,
    fontWeight: '500',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickCard: {
    flex: 1,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 14,
    minHeight: 132,
    justifyContent: 'space-between',
  },
  qicon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  quickCardDesc: {
    fontSize: 9.5,
    lineHeight: 13.5,
    marginTop: 3,
  },
  smallBtn: {
    marginTop: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  linkText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  cameraList: {
    gap: 10,
  },
  emptyCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  emptyAction: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  emptyActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  camCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 10,
  },
  camThumb: {
    height: 108,
    borderRadius: 15,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbCrosshair: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  thumbBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  thumbDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  thumbBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  thumbWatermark: {
    opacity: 0.8,
  },
  camInfo: {
    paddingTop: 10,
  },
  camHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  camName: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  camSub: {
    fontSize: 9.5,
    marginTop: 2,
  },
  resBadge: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  resBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  camActions: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
  },
  primaryMini: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryMiniText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: radii.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.input,
    borderWidth: 1,
  },
  modalBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
