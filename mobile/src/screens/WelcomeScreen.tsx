import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../design/ThemeContext';
import { VButton } from '../components/ui';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function WelcomeScreen({ onLogin, onRegister }: WelcomeScreenProps) {
  const { theme } = useTheme();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const featureAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(logoAnim, { toValue: 1, damping: 12, useNativeDriver: true }),
      Animated.spring(titleAnim, { toValue: 1, damping: 12, useNativeDriver: true }),
      Animated.spring(subtitleAnim, { toValue: 1, damping: 12, useNativeDriver: true }),
      Animated.spring(featureAnim, { toValue: 1, damping: 12, useNativeDriver: true }),
      Animated.spring(buttonsAnim, { toValue: 1, damping: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const features = [
    { icon: '📷', text: 'Turn any phone into a camera' },
    { icon: '🔒', text: 'Private P2P streaming' },
    { icon: '🎙️', text: 'Two-way talk-back audio' },
    { icon: '🔦', text: 'Remote flash control' },
  ];

  return (
    <LinearGradient
      colors={['#060F1D', '#0A1628', '#0F1F3D']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, {
        opacity: logoAnim,
        transform: [{ scale: logoAnim }, { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
      }]}>
        <Image
          source={require('../../assets/vigilix-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, {
        opacity: titleAnim,
        transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }]}>
        <Text style={styles.title}>Vigilix</Text>
        <Text style={styles.tagline}>Smart Surveillance, Simplified</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={[styles.subtitleContainer, {
        opacity: subtitleAnim,
        transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }]}>
        <Text style={styles.subtitle}>
          Transform any Android phone into a smart security camera with real-time P2P streaming.
        </Text>
      </Animated.View>

      {/* Features */}
      <Animated.View style={[styles.featuresContainer, {
        opacity: featureAnim,
        transform: [{ translateY: featureAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }]}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttonsContainer, {
        opacity: buttonsAnim,
        transform: [{ translateY: buttonsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
      }]}>
        <VButton
          title="Get Started"
          onPress={onRegister}
          variant="primary"
          size="lg"
        />
        <VButton
          title="I already have an account"
          onPress={onLogin}
          variant="ghost"
          size="md"
        />
      </Animated.View>

      {/* Bottom text */}
      <Text style={styles.footerText}>No cloud · No subscription · Privacy first</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#64B5F6',
    marginTop: 4,
  },
  subtitleContainer: {
    marginBottom: 28,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 20,
    width: 36,
  },
  featureText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.8)',
  },
  buttonsContainer: {
    alignSelf: 'stretch',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
  },
  secondaryButton: {
    borderRadius: 16,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 24,
  },
});
