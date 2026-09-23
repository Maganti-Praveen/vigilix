import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Video, Mic, Settings, Activity } from 'lucide-react-native';
import { useTheme } from '../design/ThemeContext';
import { VButton } from '../components/ui';
import { radii, spacing, typography } from '../design/tokens';

interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function WelcomeScreen({ onLogin, onRegister }: WelcomeScreenProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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
            paddingTop: Math.max(insets.top + 8, 24),
            paddingBottom: Math.max(insets.bottom + 16, 28),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header with Brandmark and Ready badge */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/vigilix-logo.png')}
              style={styles.brandmark}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.brandName, { color: theme.text.primary }]}>Vigilix</Text>
              <Text style={[styles.brandSub, { color: theme.text.secondary }]}>
                Private mobile surveillance
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.readyBadge,
              {
                backgroundColor: theme.surface.surface2,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <View style={[styles.readyDot, { backgroundColor: theme.status.success }]} />
            <Text style={[styles.readyText, { color: theme.text.secondary }]}>Ready</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.kicker, { color: theme.text.secondary }]}>
            PRIVATE · CONNECTED · INTELLIGENT
          </Text>
          <Text style={[styles.heroHeading, { color: theme.text.primary }]}>
            Security, built into the phone you already have.
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.text.secondary }]}>
            Turn a spare phone into a live camera and keep a second device as your private monitor.
          </Text>
        </View>

        {/* Camera Lens Artbox Card */}
        <View
          style={[
            styles.artbox,
            {
              backgroundColor: theme.surface.card,
              borderColor: theme.border.primary,
            },
          ]}
        >
          {/* Subtle radial glow background */}
          <View
            style={[
              styles.artboxGlow,
              { backgroundColor: theme.accent.primaryMuted },
            ]}
          />

          {/* Realistic Camera Lens Graphic */}
          <View
            style={[
              styles.lensOuter,
              {
                borderColor: theme.border.primary,
                backgroundColor: isDark ? '#05070A' : '#111318',
              },
            ]}
          >
            <View
              style={[
                styles.lensRing,
                { borderColor: 'rgba(255, 255, 255, 0.15)' },
              ]}
            >
              <View
                style={[
                  styles.lensInner,
                  { backgroundColor: isDark ? '#0A0E17' : '#1A2130' },
                ]}
              >
                <LinearGradient
                  colors={[theme.accent.secondary, theme.accent.primary]}
                  style={styles.iris}
                />
              </View>
            </View>
          </View>

          {/* Floating Pill: Stationary Cam */}
          <View
            style={[
              styles.floatPill,
              styles.floatPillBottomLeft,
              {
                backgroundColor: theme.surface.surface2,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <View style={[styles.liveDot, { backgroundColor: theme.status.live }]} />
            <Text style={[styles.floatPillText, { color: theme.text.primary }]}>
              Stationary Cam
            </Text>
          </View>

          {/* Floating Pill: 1080p Encrypted */}
          <View
            style={[
              styles.floatPill,
              styles.floatPillTopRight,
              {
                backgroundColor: theme.surface.surface2,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <Text style={[styles.floatPillText, { color: theme.text.secondary }]}>
              1080p · Encrypted
            </Text>
          </View>
        </View>

        {/* 2x2 Feature Grid */}
        <View style={styles.featureGrid}>
          {/* Feature 1 */}
          <View
            style={[
              styles.featureCard,
              {
                backgroundColor: theme.surface.card,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <View
              style={[
                styles.iconButtonSmall,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Video size={16} color={theme.accent.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text.primary }]}>Live video</Text>
            <Text style={[styles.featureDesc, { color: theme.text.secondary }]}>
              Sub-second P2P relay
            </Text>
          </View>

          {/* Feature 2 */}
          <View
            style={[
              styles.featureCard,
              {
                backgroundColor: theme.surface.card,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <View
              style={[
                styles.iconButtonSmall,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Mic size={16} color={theme.accent.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text.primary }]}>Talk back</Text>
            <Text style={[styles.featureDesc, { color: theme.text.secondary }]}>
              Two-way audio speak
            </Text>
          </View>

          {/* Feature 3 */}
          <View
            style={[
              styles.featureCard,
              {
                backgroundColor: theme.surface.card,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <View
              style={[
                styles.iconButtonSmall,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Settings size={16} color={theme.accent.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text.primary }]}>
              Remote control
            </Text>
            <Text style={[styles.featureDesc, { color: theme.text.secondary }]}>
              Torch, zoom & wake
            </Text>
          </View>

          {/* Feature 4 */}
          <View
            style={[
              styles.featureCard,
              {
                backgroundColor: theme.surface.card,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <View
              style={[
                styles.iconButtonSmall,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <Activity size={16} color={theme.accent.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text.primary }]}>Health</Text>
            <Text style={[styles.featureDesc, { color: theme.text.secondary }]}>
              Battery & thermal sync
            </Text>
          </View>
        </View>

        {/* Bottom CTA Buttons */}
        <View style={styles.actionButtons}>
          <VButton
            title="Get started"
            onPress={onRegister}
            variant="primary"
            size="lg"
            fullWidth
          />
          <VButton
            title="I already have an account"
            onPress={onLogin}
            variant="ghost"
            size="md"
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandmark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3976FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 10,
    marginTop: 1,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  readyText: {
    fontSize: 10,
    fontWeight: '500',
  },
  heroSection: {
    marginBottom: 14,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroHeading: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 31,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  artbox: {
    height: 128,
    borderRadius: radii.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  artboxGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  lensOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  lensRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lensInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iris: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: '#3976FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  floatPill: {
    position: 'absolute',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  floatPillBottomLeft: {
    bottom: 12,
    left: 12,
  },
  floatPillTopRight: {
    top: 12,
    right: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  floatPillText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 16,
  },
  featureCard: {
    width: '48.5%',
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 12,
  },
  iconButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  featureDesc: {
    fontSize: 9.5,
    marginTop: 2,
  },
  actionButtons: {
    gap: 8,
  },
});
