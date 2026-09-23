/**
 * ViewerScreen — Vigilix
 * Fullscreen live stream viewer with immersive dark HUD and floating control dock,
 * matching the visual reference design while preserving 100% of WebRTC,
 * audio talk-back, remote flash, remote recording, and signaling logic.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Alert, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator, Dimensions, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTCView } from 'react-native-webrtc';
import { LinearGradient } from 'expo-linear-gradient';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useTheme } from '../design/ThemeContext';
import { spacing, radii, typography } from '../design/tokens';
import { useSlideUp, useFadeIn } from '../design/animations';
import { useAppStore } from '../store/appStore';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import {
  ChevronLeft, Eye, Radio, Battery, Zap, VolumeX,
  Volume2, Mic, CircleDot, Circle, Square,
  Wifi, Shield, ArrowRight,
} from 'lucide-react-native';
import socketService from '../services/socketService';
import { VButton } from '../components/ui/VButton';
import { VCard } from '../components/ui/VCard';

const { width: SCREEN_W } = Dimensions.get('window');

interface ViewerScreenProps {
  onBack: () => void;
}

export function ViewerScreen({ onBack }: ViewerScreenProps) {
  const { theme } = useTheme();

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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for talk-back / reconnecting states
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

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

    // If roomCode is pre-set (from tapping saved camera on Home), auto-join
    const presetCode = useAppStore.getState().roomCode;
    if (presetCode) {
      setInputCode(presetCode);

      const doJoin = async () => {
        setIsJoining(true);
        try {
          const result = await joinRoom(presetCode);
          if (result.success) {
            setIsConnected(true);
          } else {
            setError(result.error || 'Failed to join room');
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsJoining(false);
        }
      };

      if (socketService.isConnected()) {
        doJoin();
      } else {
        const onConnect = () => {
          socketService.off('connect', onConnect);
          doJoin();
        };
        socketService.on('connect', onConnect);
      }
    }

    return () => {
      deactivateKeepAwake('viewer');
      cleanupWebRTC();
      leaveRoom();
      disconnect();
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
    cleanupWebRTC();
    leaveRoom();
    setIsConnected(false);
    setInputCode('');
    setIsTalkingBack(false);
    setFlashOn(false);
    setIsRecordingRemote(false);
  }, [cleanupWebRTC, leaveRoom, setIsTalkingBack]);

  // Hardware back button handling
  useEffect(() => {
    const onBackPress = () => {
      if (isConnected) {
        Alert.alert(
          'Disconnect Viewer',
          'Are you sure you want to disconnect from this camera?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disconnect',
              style: 'destructive',
              onPress: () => {
                handleDisconnect();
                onBack();
              },
            },
          ]
        );
        return true;
      }
      onBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isConnected, handleDisconnect, onBack]);

  // Audio mute
  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (remoteStream) {
      remoteStream.getAudioTracks().forEach((t: any) => { t.enabled = !newMuted; });
    }
  }, [isMuted, setIsMuted, remoteStream]);

  // 2-Way Talk-back
  const handleToggleTalkBack = useCallback(() => {
    const ns = !isTalkingBack;
    setIsTalkingBack(ns);
    toggleAudio(ns);
  }, [isTalkingBack, setIsTalkingBack, toggleAudio]);

  // Remote flash toggle
  const handleToggleFlash = useCallback(() => {
    const targetRoom = roomCode || inputCode;
    if (targetRoom) {
      const ns = !flashOn;
      toggleFlash(targetRoom, ns);
      setFlashOn(ns);
    }
  }, [roomCode, inputCode, flashOn, toggleFlash]);

  // Remote recording toggle
  const handleToggleRecording = useCallback(() => {
    const targetRoom = roomCode || inputCode;
    if (!targetRoom) return;
    if (isRecordingRemote) {
      stopRecording(targetRoom);
      setIsRecordingRemote(false);
    } else {
      startRecording(targetRoom);
      setIsRecordingRemote(true);
    }
  }, [roomCode, inputCode, isRecordingRemote, startRecording, stopRecording]);

  const handleBack = useCallback(() => {
    if (isConnected) {
      Alert.alert('Disconnect Stream?', 'You will leave the camera session.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => { handleDisconnect(); onBack(); } },
      ]);
    } else {
      onBack();
    }
  }, [isConnected, handleDisconnect, onBack]);

  // ─── 1. JOIN FORM (NOT CONNECTED) ─────────────────────────────────
  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg.primary} />
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.joinContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Top Navigation */}
              <View style={styles.joinTopNav}>
                <TouchableOpacity
                  style={[styles.backPill, { borderColor: theme.border.primary, backgroundColor: theme.surface.card }]}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color={theme.text.primary} />
                </TouchableOpacity>
                <View style={styles.readyBadge}>
                  <View style={[styles.readyDot, { backgroundColor: theme.accent.primary }]} />
                  <Text style={[styles.readyText, { color: theme.text.secondary }]}>Viewer Mode</Text>
                </View>
              </View>

              {/* Header */}
              <Animated.View style={[styles.joinHeader, formAnim]}>
                <View style={[styles.iconBox, { borderColor: theme.border.primary, backgroundColor: theme.surface.card }]}>
                  <Eye size={28} color={theme.accent.primary} />
                </View>
                <Text style={[styles.kicker, { color: theme.accent.primary }]}>REMOTE MONITOR</Text>
                <Text style={[styles.joinTitle, { color: theme.text.primary }]}>Connect to Camera</Text>
                <Text style={[styles.joinSubtitle, { color: theme.text.secondary }]}>
                  Enter the 4–6 character room code displayed on your Vigilix camera device.
                </Text>
              </Animated.View>

              {/* Code Input Card */}
              <VCard style={{ marginTop: spacing['2'] }}>
                <Text style={[styles.inputLabel, { color: theme.text.tertiary }]}>ROOM CODE</Text>
                <TextInput
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: theme.surface.input,
                      borderColor: theme.border.primary,
                      color: theme.text.primary,
                    },
                  ]}
                  value={inputCode}
                  onChangeText={(t) => setInputCode(t.toUpperCase())}
                  placeholder="XK92"
                  placeholderTextColor={theme.text.tertiary}
                  autoCapitalize="characters"
                  maxLength={6}
                  textAlign="center"
                  autoCorrect={false}
                />
              </VCard>

              {/* Connect Button */}
              <View style={{ marginTop: spacing['2'] }}>
                <VButton
                  title={isJoining ? 'Connecting to Camera…' : 'Join Live Stream'}
                  icon={<Radio size={18} color="#FFF" />}
                  onPress={handleJoinRoom}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isJoining}
                  disabled={inputCode.trim().length < 4 || connectionStatus !== 'connected'}
                />
              </View>

              {/* Connection Status Notice */}
              {connectionStatus !== 'connected' ? (
                <View style={styles.offlineNotice}>
                  <ActivityIndicator size="small" color={theme.accent.primary} />
                  <Text style={[styles.offlineText, { color: theme.text.tertiary }]}>
                    Connecting to signaling server…
                  </Text>
                </View>
              ) : (
                <View style={styles.onlineNotice}>
                  <Shield size={14} color={theme.status.success} />
                  <Text style={[styles.onlineText, { color: theme.text.tertiary }]}>
                    End-to-end encrypted WebRTC channel ready
                  </Text>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ─── 2. LIVE STREAM VIEW (CONNECTED) ──────────────────────────────
  const activeRoom = roomCode || inputCode;

  return (
    <View style={styles.liveContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Video Surface */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        /* Immersive Placeholder Background */
        <LinearGradient
          colors={['#152133', '#070B11', '#0B1017']}
          style={[StyleSheet.absoluteFill, styles.waitingView]}
        >
          {/* Subtle camera reticle grid */}
          <View style={styles.reticleContainer}>
            <View style={styles.reticle} />
          </View>
        </LinearGradient>
      )}

      {/* Top HUD Bar */}
      <SafeAreaView edges={['top']} style={styles.topHudContainer}>
        <View style={styles.liveTop}>
          {/* Left: Back button + Camera name / Room pill */}
          <View style={styles.topLeftGroup}>
            <TouchableOpacity
              style={styles.hudBackButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.hudPill}>
              <Text style={styles.hudPillText}>{activeRoom ? `Room ${activeRoom}` : 'Live Camera'}</Text>
            </View>
          </View>

          {/* Right: Signal / Quality / Battery HUD pills */}
          <View style={styles.topRightGroup}>
            <View style={styles.hudPill}>
              <View style={[styles.signalDot, { backgroundColor: peerConnected ? '#22C55E' : '#F59E0B' }]} />
              <Text style={[styles.hudPillText, { color: peerConnected ? '#22C55E' : '#F59E0B' }]}>
                {peerConnected ? 'Excellent' : 'Connecting'}
              </Text>
            </View>

            {batteryInfo && (
              <View style={styles.hudPill}>
                {batteryInfo.isCharging ? (
                  <Zap size={11} color="#FBBF24" />
                ) : (
                  <Battery size={11} color="#CBD5E1" />
                )}
                <Text style={styles.hudPillText}>
                  {Math.round(batteryInfo.level * 100)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Center Reconnecting / Waiting HUD Modal Card (Matching Reference .reconnect) */}
      {!peerConnected && (
        <View style={styles.reconnectCard}>
          <ActivityIndicator size="small" color="#6F9CFF" style={{ marginBottom: 10 }} />
          <Text style={styles.reconnectTitle}>Connecting to camera</Text>
          <Text style={styles.reconnectSubtitle}>Establishing peer stream · Grace period active</Text>
        </View>
      )}

      {/* Center Talk-Back Audio Pulse Overlay (when user is speaking) */}
      {isTalkingBack && (
        <View style={styles.talkBackOverlay} pointerEvents="none">
          <Animated.View style={[styles.talkBackRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.talkBackPill}>
            <Mic size={14} color="#6F9CFF" />
            <Text style={styles.talkBackText}>Talk-Back Active</Text>
          </View>
        </View>
      )}

      {/* Center Remote Recording Badge (when recording is active) */}
      {isRecordingRemote && (
        <View style={styles.recordingBadgeOverlay} pointerEvents="none">
          <View style={styles.recordingBadge}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC Remote</Text>
          </View>
        </View>
      )}

      {/* Floating 5-Button Translucent Control Dock (Matching Reference .controls) */}
      <View style={styles.bottomDockContainer}>
        <View style={styles.controlsDock}>
          {/* 1. Mute / Unmute Audio */}
          <TouchableOpacity
            style={[styles.ctlButton, !isMuted && styles.ctlActive]}
            onPress={handleToggleMute}
            activeOpacity={0.75}
          >
            {isMuted ? (
              <VolumeX size={19} color="#EF4444" />
            ) : (
              <Volume2 size={19} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* 2. 2-Way Talk-Back (Microphone) */}
          <TouchableOpacity
            style={[
              styles.ctlButton,
              isTalkingBack && styles.ctlActiveGlow,
            ]}
            onPress={handleToggleTalkBack}
            activeOpacity={0.75}
          >
            <Mic size={19} color={isTalkingBack ? '#6F9CFF' : '#FFFFFF'} />
          </TouchableOpacity>

          {/* 3. Remote Torch / Flash */}
          <TouchableOpacity
            style={[styles.ctlButton, flashOn && styles.ctlActiveAmber]}
            onPress={handleToggleFlash}
            activeOpacity={0.75}
          >
            <Zap size={19} color={flashOn ? '#FBBF24' : '#FFFFFF'} />
          </TouchableOpacity>

          {/* 4. Remote Recording */}
          <TouchableOpacity
            style={[styles.ctlButton, isRecordingRemote && styles.ctlActiveRed]}
            onPress={handleToggleRecording}
            activeOpacity={0.75}
          >
            {isRecordingRemote ? (
              <CircleDot size={22} color="#EF4444" />
            ) : (
              <Circle size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* 5. Leave / Disconnect */}
          <TouchableOpacity
            style={[styles.ctlButton, styles.ctlStop]}
            onPress={handleDisconnect}
            activeOpacity={0.75}
          >
            <Square size={16} color="#EF4444" />
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
  liveContainer: {
    flex: 1,
    backgroundColor: '#05080D',
  },

  // ─── Join Form Styles ─────────────────────────────────────────────
  joinContent: {
    flexGrow: 1,
    padding: spacing['5'],
    gap: spacing['4'],
    paddingBottom: spacing['10'],
  },
  joinTopNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2'],
  },
  backPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(57,118,255,0.08)',
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  readyText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
  },
  joinHeader: {
    alignItems: 'center',
    paddingVertical: spacing['4'],
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3'],
  },
  kicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  joinTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  joinSubtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semibold,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  codeInput: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 8,
    borderWidth: 1,
    borderRadius: 13,
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['4'],
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
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
  },
  onlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: spacing['2'],
  },
  onlineText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
  },

  // ─── Live View Styles ─────────────────────────────────────────────
  waitingView: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderStyle: 'dashed',
  },

  // Top HUD Bar
  topHudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  liveTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingTop: 10,
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudBackButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(4,8,13,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(4,8,13,0.54)',
  },
  hudPillText: {
    color: '#E7EBF2',
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Center Reconnecting Card (.reconnect)
  reconnectCard: {
    position: 'absolute',
    left: '50%',
    top: '48%',
    transform: [{ translateX: -140 }, { translateY: -40 }],
    width: 280,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(5,9,14,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reconnectTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 4,
    textAlign: 'center',
  },
  reconnectSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },

  // Talk-Back Center Ring
  talkBackOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '42%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  talkBackRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(111,156,255,0.4)',
    backgroundColor: 'rgba(111,156,255,0.08)',
  },
  talkBackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(4,8,13,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(111,156,255,0.4)',
  },
  talkBackText: {
    color: '#6F9CFF',
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
  },

  // Remote Recording Indicator
  recordingBadgeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 90,
    alignItems: 'center',
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    color: '#F87171',
    fontSize: 10,
    fontFamily: typography.fontFamily.semibold,
    letterSpacing: 0.5,
  },

  // ─── Floating 5-Button Bottom Dock (.controls & .ctl) ──────────────
  bottomDockContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 15,
  },
  controlsDock: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(5,9,14,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ctlButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctlActive: {
    backgroundColor: 'rgba(57,118,255,0.22)',
    borderColor: 'rgba(57,118,255,0.55)',
  },
  ctlActiveGlow: {
    backgroundColor: 'rgba(111,156,255,0.25)',
    borderColor: 'rgba(111,156,255,0.7)',
  },
  ctlActiveAmber: {
    backgroundColor: 'rgba(245,158,11,0.22)',
    borderColor: 'rgba(245,158,11,0.55)',
  },
  ctlActiveRed: {
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderColor: 'rgba(239,68,68,0.6)',
  },
  ctlStop: {
    backgroundColor: 'rgba(239,68,68,0.16)',
    borderColor: 'rgba(239,68,68,0.35)',
  },
});
