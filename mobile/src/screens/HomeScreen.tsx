/**
 * HomeScreen — Vigilix Dashboard
 * Smart-home style dashboard with saved cameras, mode cards, quick actions, and status.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  TouchableOpacity, Animated, Image, Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../design/ThemeContext';
import { spacing, radii, typography, shadows } from '../design/tokens';
import { useStaggeredEntrance, useScalePress } from '../design/animations';
import { VCard } from '../components/ui/VCard';
import { VBadge } from '../components/ui/VBadge';
import { useAuthStore, Device } from '../store/authStore';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onSelectMode: (mode: 'camera' | 'viewer') => void;
}

export function HomeScreen({ onSelectMode }: HomeScreenProps) {
  const { theme, isDark } = useTheme();
  const anims = useStaggeredEntrance(6, 100);
  const { user, devices, loadDevices, isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);

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

  const cameras = devices.filter(d => d.role === 'camera');
  const viewers = devices.filter(d => d.role === 'viewer');
  const onlineCameras = cameras.filter(d => d.isOnline);

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent.primary} />
        }
      >
        {/* ─── Header ─── */}
        <Animated.View
          style={[
            styles.header,
            { opacity: anims[0].opacity, transform: [{ translateY: anims[0].translateY }] },
          ]}
        >
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/vigilix-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.greeting, { color: theme.text.secondary }]}>
                {getGreeting()}, {firstName}
              </Text>
              <Text style={[styles.brandName, { color: theme.text.primary }]}>Vigilix</Text>
            </View>
          </View>
          <VBadge
            label={onlineCameras.length > 0 ? `${onlineCameras.length} Online` : 'All Clear'}
            variant={onlineCameras.length > 0 ? 'success' : 'default'}
            icon={onlineCameras.length > 0 ? '●' : '✓'}
          />
        </Animated.View>

        {/* ─── Saved Cameras ─── */}
        {cameras.length > 0 && (
          <Animated.View
            style={[
              { opacity: anims[1].opacity, transform: [{ translateY: anims[1].translateY }] },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
              My Cameras
            </Text>
            {cameras.map((camera) => (
              <CameraCard
                key={camera._id}
                camera={camera}
                onPress={() => onSelectMode('viewer')}
              />
            ))}
          </Animated.View>
        )}

        {/* ─── Mode Cards ─── */}
        <Animated.View
          style={[
            styles.cardsRow,
            { opacity: anims[2].opacity, transform: [{ translateY: anims[2].translateY }] },
          ]}
        >
          <ModeCard
            title="Camera"
            subtitle="Set up as security camera"
            icon="📷"
            gradient={theme.gradient.primary}
            onPress={() => onSelectMode('camera')}
          />
          <ModeCard
            title="Viewer"
            subtitle="Watch live camera feed"
            icon="👁️"
            gradient={isDark ? ['#0D9488', '#0F766E'] : ['#14B8A6', '#0D9488']}
            onPress={() => onSelectMode('viewer')}
          />
        </Animated.View>

        {/* ─── Quick Actions ─── */}
        <Animated.View
          style={[
            { opacity: anims[3].opacity, transform: [{ translateY: anims[3].translateY }] },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsRow}>
            {[
              { icon: '📡', label: 'Start Stream', action: () => onSelectMode('camera') },
              { icon: '🔗', label: 'Join Camera', action: () => onSelectMode('viewer') },
              { icon: '📸', label: 'Snapshot', action: () => {} },
              { icon: '🔔', label: 'Alerts', action: () => {} },
            ].map((item, i) => (
              <QuickAction key={i} {...item} />
            ))}
          </View>
        </Animated.View>

        {/* ─── Status Overview ─── */}
        <Animated.View
          style={[
            { opacity: anims[4].opacity, transform: [{ translateY: anims[4].translateY }] },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
            System Status
          </Text>
          <VCard>
            <View style={styles.statusGrid}>
              <StatusRow label="Cameras Paired" value={String(cameras.length)} />
              <StatusRow label="Cameras Online" value={String(onlineCameras.length)} accent={onlineCameras.length > 0} />
              <StatusRow label="Viewers" value={String(viewers.length)} />
              <StatusRow label="Network" value="Ready" accent />
            </View>
          </VCard>
        </Animated.View>

        {/* ─── Footer ─── */}
        <Animated.View
          style={[
            styles.footer,
            { opacity: anims[5].opacity, transform: [{ translateY: anims[5].translateY }] },
          ]}
        >
          <Text style={[styles.footerText, { color: theme.text.tertiary }]}>
            Peer-to-peer · End-to-end · No cloud
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Greeting helper ─────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Camera Card ─────────────────────────────────────────────────

function CameraCard({ camera, onPress }: { camera: Device; onPress: () => void }) {
  const { theme } = useTheme();
  const { style: animStyle, pressProps } = useScalePress(0.97);

  return (
    <Animated.View style={[{ marginBottom: spacing['3'] }, animStyle]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} {...pressProps}>
        <View style={[styles.cameraCard, {
          backgroundColor: theme.surface.card,
          borderColor: camera.isOnline ? theme.accent.primary : theme.surface.cardBorder,
          borderWidth: camera.isOnline ? 1.5 : 1,
        }]}>
          <View style={styles.cameraCardLeft}>
            <View style={[styles.cameraIcon, {
              backgroundColor: camera.isOnline ? 'rgba(34,197,94,0.15)' : 'rgba(156,163,175,0.15)',
            }]}>
              <Text style={{ fontSize: 22 }}>{camera.isOnline ? '📹' : '📷'}</Text>
            </View>
            <View>
              <Text style={[styles.cameraName, { color: theme.text.primary }]}>
                {camera.deviceName}
              </Text>
              <Text style={[styles.cameraStatus, {
                color: camera.isOnline ? '#22C55E' : theme.text.tertiary,
              }]}>
                {camera.isOnline ? '● Online' : '○ Offline'}
                {camera.roomCode ? `  ·  ${camera.roomCode}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.cameraCardRight}>
            {camera.lastBatteryLevel != null && (
              <Text style={[styles.cameraBattery, { color: theme.text.tertiary }]}>
                🔋 {camera.lastBatteryLevel}%
              </Text>
            )}
            <Text style={{ color: theme.text.tertiary, fontSize: 18 }}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Mode Card ───────────────────────────────────────────────────

function ModeCard({
  title, subtitle, icon, gradient, onPress,
}: {
  title: string; subtitle: string; icon: string;
  gradient: readonly string[] | string[]; onPress: () => void;
}) {
  const { style: animStyle, pressProps } = useScalePress(0.96);

  return (
    <Animated.View style={[{ flex: 1 }, animStyle]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} {...pressProps}>
        <LinearGradient
          colors={gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modeCard}
        >
          <Text style={styles.modeIcon}>{icon}</Text>
          <Text style={styles.modeTitle}>{title}</Text>
          <Text style={styles.modeSubtitle}>{subtitle}</Text>
          <View style={styles.modeArrow}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Quick Action ────────────────────────────────────────────────

function QuickAction({ icon, label, action }: { icon: string; label: string; action: () => void }) {
  const { theme } = useTheme();
  const { style: animStyle, pressProps } = useScalePress(0.92);

  return (
    <Animated.View style={[{ flex: 1 }, animStyle]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={action}
        {...pressProps}
        style={[
          styles.quickAction,
          {
            backgroundColor: theme.surface.card,
            borderColor: theme.surface.cardBorder,
          },
        ]}
      >
        <Text style={{ fontSize: 22 }}>{icon}</Text>
        <Text style={[styles.quickLabel, { color: theme.text.secondary }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Status Row ──────────────────────────────────────────────────

function StatusRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={styles.statusRow}>
      <Text style={[styles.statusLabel, { color: theme.text.tertiary }]}>{label}</Text>
      <Text
        style={[
          styles.statusValue,
          { color: accent ? theme.accent.primary : theme.text.primary },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing['5'],
    paddingBottom: spacing['20'],
    gap: spacing['6'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing['2'],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
  },
  greeting: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.regular,
  },
  brandName: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.fontFamily.bold,
    letterSpacing: -0.5,
  },

  // Section
  sectionTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing['3'],
  },

  // Mode Cards
  cardsRow: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  modeCard: {
    borderRadius: radii['2xl'],
    padding: spacing['5'],
    minHeight: 160,
    justifyContent: 'flex-end',
  },
  modeIcon: {
    fontSize: 28,
    marginBottom: spacing['3'],
  },
  modeTitle: {
    fontSize: typography.size.xl,
    fontFamily: typography.fontFamily.bold,
    color: '#FFF',
    marginBottom: 2,
  },
  modeSubtitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
  },
  modeArrow: {
    position: 'absolute',
    top: spacing['4'],
    right: spacing['4'],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  quickAction: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4'],
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing['1.5'],
  },
  quickLabel: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },

  // Status
  statusGrid: {
    gap: spacing['3'],
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.regular,
  },
  statusValue: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.semibold,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: spacing['4'],
  },
  footerText: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.regular,
    letterSpacing: typography.letterSpacing.wider,
  },

  // Camera Card
  cameraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing['4'],
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  cameraCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
    flex: 1,
  },
  cameraIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraName: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.semibold,
  },
  cameraStatus: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.medium,
    marginTop: 2,
  },
  cameraCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  cameraBattery: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.medium,
  },
});
