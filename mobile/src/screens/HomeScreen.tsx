/**
 * HomeScreen — Vigilix Dashboard
 * Smart-home style dashboard with mode cards, quick actions, and status.
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  TouchableOpacity, Animated, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../design/ThemeContext';
import { spacing, radii, typography, shadows } from '../design/tokens';
import { useStaggeredEntrance, useScalePress } from '../design/animations';
import { VCard } from '../components/ui/VCard';
import { VBadge } from '../components/ui/VBadge';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onSelectMode: (mode: 'camera' | 'viewer') => void;
}

export function HomeScreen({ onSelectMode }: HomeScreenProps) {
  const { theme, isDark } = useTheme();
  const anims = useStaggeredEntrance(5, 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
              <Text style={[styles.greeting, { color: theme.text.secondary }]}>Welcome to</Text>
              <Text style={[styles.brandName, { color: theme.text.primary }]}>Vigilix</Text>
            </View>
          </View>
          <VBadge label="All Clear" variant="success" icon="✓" />
        </Animated.View>

        {/* ─── Mode Cards ─── */}
        <Animated.View
          style={[
            styles.cardsRow,
            { opacity: anims[1].opacity, transform: [{ translateY: anims[1].translateY }] },
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
            { opacity: anims[2].opacity, transform: [{ translateY: anims[2].translateY }] },
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
            { opacity: anims[3].opacity, transform: [{ translateY: anims[3].translateY }] },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
            System Status
          </Text>
          <VCard>
            <View style={styles.statusGrid}>
              <StatusRow label="Cameras Online" value="0" />
              <StatusRow label="Active Viewers" value="0" />
              <StatusRow label="Network" value="Ready" accent />
              <StatusRow label="Quality" value="HD" />
            </View>
          </VCard>
        </Animated.View>

        {/* ─── Footer ─── */}
        <Animated.View
          style={[
            styles.footer,
            { opacity: anims[4].opacity, transform: [{ translateY: anims[4].translateY }] },
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
});
