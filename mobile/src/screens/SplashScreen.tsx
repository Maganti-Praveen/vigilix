/**
 * SplashScreen — Vigilix
 * Animated premium splash with logo, glow, and tagline.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing } from '../design/tokens';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Glow fades in
      Animated.timing(glowOpacity, {
        toValue: 0.6,
        duration: 600,
        useNativeDriver: true,
      }),
      // 2. Logo scales in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // 3. Brand name
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // 4. Tagline
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 5. Hold
      Animated.delay(800),
      // 6. Fade out everything
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={['#060F1D', '#0B1121', '#101B33']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow behind logo */}
      <Animated.View
        style={[
          styles.glow,
          { opacity: glowOpacity },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <Image
          source={require('../../assets/vigilix-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Brand name */}
      <Animated.Text style={[styles.brandName, { opacity: textOpacity }]}>
        Vigilix
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Smart Mobile Surveillance
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(79, 142, 247, 0.08)',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing['5'],
  },
  brandName: {
    fontSize: typography.size['4xl'],
    fontFamily: typography.fontFamily.bold,
    color: '#F1F5F9',
    letterSpacing: typography.letterSpacing.wide,
  },
  tagline: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.regular,
    color: '#64748B',
    marginTop: spacing['2'],
    letterSpacing: typography.letterSpacing.wider,
  },
});
