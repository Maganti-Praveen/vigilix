/**
 * ViewerScreen — Vigilix
 * Fullscreen stream viewer with floating controls and smart-home feel.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Alert, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTCView } from 'react-native-webrtc';
import { LinearGradient } from 'expo-linear-gradient';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useTheme } from '../design/ThemeContext';
import { spacing, radii, typography } from '../design/tokens';
import { useSlideUp, useScalePress, useFadeIn } from '../design/animations';
import { useAppStore } from '../store/appStore';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { VButton } from '../components/ui/VButton';
import { VCard } from '../components/ui/VCard';
import { VIconButton } from '../components/ui/VIconButton';
import { VBadge } from '../components/ui/VBadge';
import { VGlass } from '../components/ui/VGlass';
import { VInput } from '../components/ui/VInput';

const { width: SCREEN_W } = Dimensions.get('window');

interface ViewerScreenProps {
  onBack: () => void;
}

export function ViewerScreen({ onBack }: ViewerScreenProps) {
  const { theme, isDark } = useTheme();

  const {
    roomCode, isStreaming, connectionStatus, streamQuality,
    isMuted, isTalkingBack, batteryInfo,
    setIsMuted, setIsTalkingBack, setMode, setError,
  } = useAppStore();

  const { connect, joinRoom, leaveRoom, disconnect, toggleFlash, startRecording, stopRecording } = useSocket();
  const { remoteStream, peerConnected, toggleAudio, cleanup: cleanupWebRTC } = useWebRTC();

  const [inputCode, setInputCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isRecordingRemote, setIsRecordingRemote] = useState(false);

  // Animations
  const formAnim = useSlideUp(100, 30);

  // Keep-awake while viewing
  useEffect(() => {
    if (isConnected && peerConnected) {
      activateKeepAwakeAsync('viewer').catch(() => {});
    } else {
      deactivateKeepAwake('viewer');
    }
    return () => { deactivateKeepAwake('viewer'); };
  }, [isConnected, peerConnected]);

  // Mount
  useEffect(() => {
    setMode('viewer');
    connect();
    return () => {
      deactivateKeepAwake('viewer');
      cleanupWebRTC(); leaveRoom(); disconnect();
    };
  }, []);

  // Join room
  const handleJoinRoom = useCallback(async () => {
    const code = inputCode.trim().toUpperCase();
    if (code.length < 4) {
      Alert.alert('Invalid Code', 'Enter a valid room code (4–6 characters)');
      return;
    }
    setIsJoining(true);
    setError(null);
    try {
      const result = await joinRoom(code);
      if (result.success) {
        setIsConnected(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to join room');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Connection failed');
    } finally {
      setIsJoining(false);
    }
  }, [inputCode, joinRoom, setError]);

  // Disconnect
  const handleDisconnect = useCallback(() => {
    cleanupWebRTC(); leaveRoom();
    setIsConnected(false); setInputCode('');
    setIsTalkingBack(false); setFlashOn(false);
  }, [cleanupWebRTC, leaveRoom, setIsTalkingBack]);

  // Controls
  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (remoteStream) {
      remoteStream.getAudioTracks().forEach((t: any) => { t.enabled = !newMuted; });
    }
  }, [isMuted, setIsMuted, remoteStream]);

  const handleToggleTalkBack = useCallback(() => {
    const ns = !isTalkingBack;
    setIsTalkingBack(ns);
    toggleAudio(ns);
  }, [isTalkingBack, setIsTalkingBack, toggleAudio]);

  const handleToggleFlash = useCallback(() => {
    if (roomCode) {
      const ns = !flashOn;
      toggleFlash(roomCode, ns);
      setFlashOn(ns);
    }
  }, [roomCode, flashOn, toggleFlash]);

  const handleToggleRecording = useCallback(() => {
    if (!roomCode) return;
    if (isRecordingRemote) {
      stopRecording(roomCode);
      setIsRecordingRemote(false);
    } else {
      startRecording(roomCode);
      setIsRecordingRemote(true);
    }
  }, [roomCode, isRecordingRemote, startRecording, stopRecording]);

  const handleBack = useCallback(() => {
    if (isConnected) {
      Alert.alert('Disconnect?', 'You will be disconnected.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => { handleDisconnect(); onBack(); } },
      ]);
    } else { onBack(); }
  }, [isConnected, handleDisconnect, onBack]);

  // ─── Join Form (not connected) ─────────────────────────────────
  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
        <StatusBar barStyle={theme.statusBar} />
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.joinContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Back */}
              <VIconButton icon="←" onPress={handleBack} size="sm" />

              {/* Header */}
              <Animated.View style={[styles.joinHeader, formAnim]}>
                <Text style={{ fontSize: 56, marginBottom: spacing['4'] }}>👁️</Text>
                <Text style={[styles.joinTitle, { color: theme.text.primary }]}>
                  Connect to Camera
                </Text>
                <Text style={[styles.joinSubtitle, { color: theme.text.secondary }]}>
                  Enter the room code shown on the camera device
                </Text>
              </Animated.View>

              {/* Code Input */}
              <VCard>
                <TextInput
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: theme.surface.input,
                      borderColor: theme.surface.inputBorder,
                      color: theme.text.primary,
                    },
                  ]}
                  value={inputCode}
                  onChangeText={(t) => setInputCode(t.toUpperCase())}
                  placeholder="ROOM CODE"
                  placeholderTextColor={theme.text.tertiary}
                  autoCapitalize="characters"
                  maxLength={6}
                  textAlign="center"
                  autoCorrect={false}
                />
              </VCard>

              {/* Join Button */}
              <VButton
                title={isJoining ? 'Connecting…' : 'Connect'}
                icon="📡"
                onPress={handleJoinRoom}
                variant="primary"
                size="lg"
                fullWidth
                loading={isJoining}
                disabled={inputCode.trim().length < 4 || connectionStatus !== 'connected'}
              />

              {connectionStatus !== 'connected' && (
                <View style={styles.offlineNotice}>
                  <ActivityIndicator size="small" color={theme.accent.primary} />
                  <Text style={[styles.offlineText, { color: theme.text.tertiary }]}>
                    Connecting to server…
                  </Text>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Stream View (connected) ───────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Video */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <LinearGradient
          colors={['#0B1121', '#152036', '#1A2744']}
          style={[StyleSheet.absoluteFill, styles.waitingView]}
        >
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.waitingText}>
            {isStreaming ? 'Connecting to stream…' : 'Waiting for camera…'}
          </Text>
          <Text style={styles.waitingSubtext}>Room: {roomCode}</Text>
        </LinearGradient>
      )}

      {/* Top overlay */}
      <View style={styles.topOverlay}>
        <View style={styles.topLeft}>
          <VIconButton icon="←" onPress={handleBack} glass size="sm" />
          {peerConnected && <VBadge label="LIVE" variant="live" pulse />}
        </View>
        <View style={styles.topRight}>
          <VBadge label={streamQuality} variant="default" />
          {batteryInfo && (
            <VBadge
              label={`${Math.round(batteryInfo.level * 100)}%${batteryInfo.isCharging ? ' ⚡' : ''}`}
              variant={batteryInfo.level < 0.2 ? 'warning' : 'default'}
              icon="🔋"
            />
          )}
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomDock}>
        <VGlass intensity={28} radius={radii['3xl']}>
          <View style={styles.controlsRow}>
            <VIconButton
              icon={isMuted ? '🔇' : '🔊'}
              label={isMuted ? 'Unmute' : 'Mute'}
              onPress={handleToggleMute}
              active={!isMuted}
              glass
            />
            <VIconButton
              icon="🎙️"
              label={isTalkingBack ? 'Talking' : 'Talk'}
              onPress={handleToggleTalkBack}
              active={isTalkingBack}
              glass
            />
            <VIconButton
              icon="🔦"
              label={flashOn ? 'On' : 'Flash'}
              onPress={handleToggleFlash}
              active={flashOn}
              glass
            />
            <VIconButton
              icon="📸"
              label="Snap"
              onPress={() => Alert.alert('Snapshot', 'Coming soon')}
              glass
            />
            <VIconButton
              icon={isRecordingRemote ? '⏺️' : '🔴'}
              label={isRecordingRemote ? 'Stop' : 'Record'}
              onPress={handleToggleRecording}
              active={isRecordingRemote}
              danger={isRecordingRemote}
              glass
            />
            <VIconButton
              icon="⏹️"
              label="Leave"
              onPress={handleDisconnect}
              danger
              glass
            />
          </View>
        </VGlass>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Join form
  joinContent: {
    flexGrow: 1,
    padding: spacing['5'],
    gap: spacing['5'],
  },
  joinHeader: {
    alignItems: 'center',
    paddingTop: spacing['10'],
    paddingBottom: spacing['4'],
  },
  joinTitle: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing['2'],
    textAlign: 'center',
  },
  joinSubtitle: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  codeInput: {
    fontSize: typography.size['3xl'],
    fontFamily: typography.fontFamily.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: 10,
    borderWidth: 1.5,
    borderRadius: radii.xl,
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['5'],
    textAlign: 'center',
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
    paddingTop: spacing['2'],
  },
  offlineText: {
    fontSize: typography.size.sm,
  },

  // Stream view
  waitingView: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing['4'],
  },
  waitingText: {
    color: '#F1F5F9',
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.semibold,
  },
  waitingSubtext: {
    color: '#64748B',
    fontSize: typography.size.sm,
  },

  // Overlays
  topOverlay: {
    position: 'absolute',
    top: 50,
    left: spacing['4'],
    right: spacing['4'],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  topLeft: { flexDirection: 'row', gap: spacing['2'], alignItems: 'center' },
  topRight: { flexDirection: 'row', gap: spacing['2'], alignItems: 'center' },

  bottomDock: {
    position: 'absolute',
    bottom: spacing['10'],
    left: spacing['4'],
    right: spacing['4'],
    zIndex: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
