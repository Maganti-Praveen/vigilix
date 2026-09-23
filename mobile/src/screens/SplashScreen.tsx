/**
 * SplashScreen — Vigilix
 * Matches the reference design with ambient glow, shield brandmark,
 * tracked typography, and animated progress track.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../design/ThemeContext';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const { theme, isDark } = useTheme();

  const logoScale = useRef(new Animated.Value(0.78)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const screenFadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Ambient glow pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress bar fill animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    // Screen entrance & completion sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(screenFadeOut, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.bg.primary,
          opacity: screenFadeOut,
        },
      ]}
    >
      {/* Background ambient radial glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: theme.accent.primary,
            opacity: glowPulse,
          },
        ]}
      />

      <View style={styles.centerBox}>
        {/* Brandmark Tile */}
        <Animated.View
          style={[
            styles.logoTileWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.accent.secondary, theme.accent.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoTile}
          >
            <Svg width={42} height={42} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                fill="rgba(255, 255, 255, 0.12)"
                stroke="#FFFFFF"
                strokeWidth={1.8}
              />
              <Circle cx={12} cy={11} r={3.2} stroke="#FFFFFF" strokeWidth={1.8} />
              <Path d="M12 7.8v.01M9 14.2l6-6" stroke="#FFFFFF" strokeWidth={1.8} />
            </Svg>
          </LinearGradient>
        </Animated.View>

        {/* Brand Title */}
        <Animated.Text
          style={[
            styles.brandTitle,
            {
              color: theme.text.primary,
              opacity: contentOpacity,
            },
          ]}
        >
          VIGILIX
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.brandSubtitle,
            {
              color: theme.text.secondary,
              opacity: contentOpacity,
            },
          ]}
        >
          Private mobile surveillance
        </Animated.Text>

        {/* Animated Progress Bar */}
        <Animated.View
          style={[
            styles.progressBarTrack,
            {
              backgroundColor: theme.border.primary,
              opacity: contentOpacity,
            },
          ]}
        >
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
            <LinearGradient
              colors={[theme.accent.secondary, theme.accent.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
      </View>

      {/* Skip button at the bottom */}
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={onFinish}
        style={styles.skipButton}
      >
        <Text style={[styles.skipText, { color: theme.text.tertiary }]}>Skip</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTileWrap: {
    shadowColor: '#3976FF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 12,
  },
  logoTile: {
    width: 82,
    height: 82,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 6,
    marginTop: 22,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 6,
    textAlign: 'center',
  },
  progressBarTrack: {
    width: 160,
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 28,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  skipButton: {
    position: 'absolute',
    bottom: 36,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
