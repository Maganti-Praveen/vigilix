/**
 * DeviceSetupScreen — Vigilix
 * First-time device registration: "Use this phone as Camera or Viewer?"
 * Shows after first login when no devices are registered.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Alert,
  TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Device from 'expo-device';
import { useAuthStore } from '../store/authStore';

interface DeviceSetupScreenProps {
  onComplete: () => void;
}

export default function DeviceSetupScreen({ onComplete }: DeviceSetupScreenProps) {
  const { registerDevice } = useAuthStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'camera' | 'viewer' | null>(null);

  const deviceModel = Device.modelName || Device.deviceName || 'Android Device';
  const deviceName = `${deviceModel}`;

  const handleSelectRole = async (role: 'camera' | 'viewer') => {
    setSelectedRole(role);
    setIsRegistering(true);

    try {
      const name = role === 'camera'
        ? `${deviceName} Camera`
        : `${deviceName} Viewer`;

      const device = await registerDevice(name, deviceModel, role);

      if (device) {
        onComplete();
      } else {
        Alert.alert('Error', 'Failed to register device. Please try again.');
        setSelectedRole(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
      setSelectedRole(null);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <LinearGradient
      colors={['#060F1D', '#0A1628', '#0F1F3D']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>📱</Text>
        <Text style={styles.title}>Set Up This Device</Text>
        <Text style={styles.subtitle}>
          How will you use {deviceModel}?
        </Text>
      </View>

      {/* Role Cards */}
      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={[styles.card, selectedRole === 'camera' && styles.cardSelected]}
          onPress={() => handleSelectRole('camera')}
          disabled={isRegistering}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1E40AF', '#2563EB']}
            style={styles.cardGradient}
          >
            <Text style={styles.cardEmoji}>📷</Text>
            <Text style={styles.cardTitle}>Security Camera</Text>
            <Text style={styles.cardDescription}>
              This phone will stream video and audio. Place it where you want to monitor.
            </Text>
            <View style={styles.cardFeatures}>
              <Text style={styles.featureText}>• Streams live video</Text>
              <Text style={styles.featureText}>• Background recording</Text>
              <Text style={styles.featureText}>• Remote flash control</Text>
              <Text style={styles.featureText}>• Saves recordings locally</Text>
            </View>
            {isRegistering && selectedRole === 'camera' && (
              <ActivityIndicator color="#FFF" style={styles.loader} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, selectedRole === 'viewer' && styles.cardSelected]}
          onPress={() => handleSelectRole('viewer')}
          disabled={isRegistering}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0D9488', '#0F766E']}
            style={styles.cardGradient}
          >
            <Text style={styles.cardEmoji}>👁️</Text>
            <Text style={styles.cardTitle}>Viewer / Monitor</Text>
            <Text style={styles.cardDescription}>
              Watch your cameras live, talk back, control flash, and start recordings.
            </Text>
            <View style={styles.cardFeatures}>
              <Text style={styles.featureText}>• Watch live feed</Text>
              <Text style={styles.featureText}>• Two-way audio</Text>
              <Text style={styles.featureText}>• Remote controls</Text>
              <Text style={styles.featureText}>• Wake up cameras</Text>
            </View>
            {isRegistering && selectedRole === 'viewer' && (
              <ActivityIndicator color="#FFF" style={styles.loader} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        You can change this later in Settings
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#60A5FA',
  },
  cardGradient: {
    padding: 24,
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFeatures: {
    gap: 4,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  loader: {
    marginTop: 12,
  },
  footer: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 24,
  },
});
