/**
 * CameraScreen — Vigilix
 * Immersive fullscreen camera with floating glassmorphic controls.
 * The most important screen in the app.
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Alert, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator, AppState,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import * as Battery from 'expo-battery';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../design/ThemeContext';
import { spacing, radii, typography } from '../design/tokens';
import { useAppStore } from '../store/appStore';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { VIconButton } from '../components/ui/VIconButton';
import { VBadge } from '../components/ui/VBadge';
import { VGlass } from '../components/ui/VGlass';
import { VButton } from '../components/ui/VButton';
import * as Clipboard from 'expo-clipboard';
import backgroundService from '../services/backgroundService';
import recordingService from '../services/recordingService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface CameraScreenProps {
  onBack: () => void;
}

export function CameraScreen({ onBack }: CameraScreenProps) {
  const { theme } = useTheme();

  const {
    roomCode, isStreaming, isFrontCamera, isFlashOn,
    isMicEnabled, isRecording, viewerCount, connectionStatus,
    streamQuality, setFlashOn, setMicEnabled, setIsRecording,
    toggleCamera, setMode, setStreamQuality, setError, error,
  } = useAppStore();

  const {
    connect, createRoom, startStream, stopStream, leaveRoom, disconnect,
    sendBatteryStatus, setOnFlashCommand, setOnRecordingCommand,
  } = useSocket();
  const {
    localStream, remoteStream, peerConnected,
    initLocalStream, switchCamera, toggleAudio, setTorch,
    isTorchSupported, setMaxBitrate, getStats,
    cleanup: cleanupWebRTC,
  } = useWebRTC();

  const [isInitializing, setIsInitializing] = useState(false);
  const [streamURL, setStreamURL] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const hasInitialized = useRef(false);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const batteryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // ─── Keep-awake ────────────────────────────────────────────────
  useEffect(() => {
    if (isStreaming) {
      activateKeepAwakeAsync('camera').catch(() => {});
    } else {
      deactivateKeepAwake('camera');
    }
    return () => { deactivateKeepAwake('camera'); };
  }, [isStreaming]);

  // ─── Battery monitoring ────────────────────────────────────────
  useEffect(() => {
    if (!isStreaming) return;
    const monitor = async () => {
      try {
        const send = async () => {
          const level = await Battery.getBatteryLevelAsync();
          const state = await Battery.getBatteryStateAsync();
          const isCharging = state === Battery.BatteryState.CHARGING;
          const { roomCode: code } = useAppStore.getState();
          if (code) sendBatteryStatus(code, level, isCharging);
          if (level < 0.15 && !isCharging) setMaxBitrate(200000);
        };
        await send();
        batteryIntervalRef.current = setInterval(send, 30000);
      } catch {}
    };
    monitor();
    return () => { if (batteryIntervalRef.current) clearInterval(batteryIntervalRef.current); };
  }, [isStreaming]);

  // ─── Mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    setMode('camera');
    setOnFlashCommand((enabled: boolean) => { setTorch(enabled); });
    // Remote recording control from viewer
    setOnRecordingCommand((action: 'start' | 'stop') => {
      if (action === 'start') {
        recordingService.start();
        setIsRecording(true);
      } else {
        recordingService.stop();
        setIsRecording(false);
      }
    });
    connect();
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (batteryIntervalRef.current) clearInterval(batteryIntervalRef.current);
      deactivateKeepAwake('camera');
      backgroundService.stop();
      cleanupWebRTC();
      leaveRoom();
      disconnect();
    };
  }, []);

  // ─── Animate controls in when streaming ────────────────────────
  useEffect(() => {
    Animated.timing(controlsOpacity, {
      toValue: streamURL ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
    Animated.timing(overlayOpacity, {
      toValue: isStreaming ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [streamURL, isStreaming]);

  // ─── Start stream ──────────────────────────────────────────────
  const handleStartStream = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const stream = await initLocalStream(
        isFrontCamera ? 'user' : 'environment', 'medium'
      );
      setStreamURL(stream.toURL());
      setTimeout(() => setTorchAvailable(isTorchSupported()), 500);
      const result = await createRoom();
      if (result.success) {
        startStream();
        // Start background service with persistent notification
        backgroundService.start({
          roomCode: result.roomCode,
          onBackground: () => console.log('[Camera] Running in background'),
          onForeground: () => console.log('[Camera] Returned to foreground'),
        });
      } else {
        setError(result.error || 'Failed to create room');
        Alert.alert('Error', result.error || 'Failed to create room');
      }
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Camera Error', err.message || 'Failed to start camera');
    } finally {
      setIsInitializing(false);
    }
  }, [isFrontCamera, initLocalStream, createRoom, startStream, isTorchSupported, setError]);

  // ─── Stop stream ───────────────────────────────────────────────
  const handleStopStream = useCallback(() => {
    if (isRecording && recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setRecordingDuration(0);
    }
    if (isFlashOn) { setTorch(false); setFlashOn(false); }
    backgroundService.stop();
    stopStream(); leaveRoom(); cleanupWebRTC();
    setStreamURL(null); setTorchAvailable(false); setError(null);
  }, [stopStream, leaveRoom, cleanupWebRTC, isRecording, isFlashOn]);

  // ─── Control handlers ─────────────────────────────────────────
  const handleToggleFlash = useCallback(() => {
    if (isFrontCamera || !torchAvailable) return;
    const ok = setTorch(!isFlashOn);
    if (ok) setFlashOn(!isFlashOn);
  }, [isFlashOn, isFrontCamera, torchAvailable, setTorch, setFlashOn]);

  const handleToggleMic = useCallback(() => {
    setMicEnabled(!isMicEnabled);
    toggleAudio(!isMicEnabled);
  }, [isMicEnabled, setMicEnabled, toggleAudio]);

  const handleSwitchCamera = useCallback(async () => {
    if (isFlashOn) { setTorch(false); setFlashOn(false); }
    toggleCamera();
    await switchCamera();
    setTimeout(() => setTorchAvailable(isTorchSupported()), 500);
  }, [toggleCamera, switchCamera, isFlashOn, setTorch, setFlashOn, isTorchSupported]);

  const handleToggleRecording = useCallback(() => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  }, [isRecording, setIsRecording]);

  const handleCopyCode = useCallback(async () => {
    if (roomCode) {
      try {
        await Clipboard.setStringAsync(roomCode);
        Alert.alert('Copied!', `Room code ${roomCode} copied to clipboard`);
      } catch { Alert.alert('Room Code', roomCode); }
    }
  }, [roomCode]);

  const handleBack = useCallback(() => {
    if (isStreaming) {
      Alert.alert('Stop Stream?', 'Going back will stop streaming.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop & Exit', style: 'destructive', onPress: () => { handleStopStream(); onBack(); } },
      ]);
    } else {
      cleanupWebRTC(); onBack();
    }
  }, [isStreaming, handleStopStream, onBack, cleanupWebRTC]);

  const displayURL = streamURL || (localStream ? localStream.toURL() : null);
  const fmt = (d: number) => `${Math.floor(d / 60)}:${(d % 60).toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ─── Camera Preview (fullscreen) ─── */}
      {displayURL ? (
        <RTCView
          streamURL={displayURL}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
          mirror={isFrontCamera}
          zOrder={0}
        />
      ) : (
        <LinearGradient
          colors={['#0B1121', '#152036', '#1A2744']}
          style={[StyleSheet.absoluteFill, styles.placeholder]}
        >
          {isInitializing ? (
            <>
              <ActivityIndicator size="large" color="#60A5FA" />
              <Text style={styles.placeholderText}>Starting camera…</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 48, marginBottom: spacing['4'] }}>📷</Text>
              <Text style={styles.placeholderTitle}>Camera Ready</Text>
              <Text style={styles.placeholderText}>
                {connectionStatus === 'connected'
                  ? 'Tap Start to begin streaming'
                  : 'Connecting to server…'}
              </Text>
              <View style={{ marginTop: spacing['8'], width: '70%' }}>
                <VButton
                  title="Start Streaming"
                  icon="📡"
                  onPress={handleStartStream}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isInitializing}
                  disabled={isInitializing || connectionStatus !== 'connected'}
                />
              </View>
            </>
          )}
        </LinearGradient>
      )}

      {/* ─── Top Overlay: Status Badges ─── */}
      <Animated.View style={[styles.topOverlay, { opacity: overlayOpacity }]}>
        <View style={styles.topLeft}>
          {isStreaming && <VBadge label="LIVE" variant="live" pulse />}
          {isRecording && <VBadge label={`REC ${fmt(recordingDuration)}`} variant="recording" pulse />}
        </View>
        <View style={styles.topRight}>
          {viewerCount > 0 && (
            <VBadge label={`${viewerCount} viewer${viewerCount !== 1 ? 's' : ''}`} variant="info" icon="👁️" />
          )}
          <VBadge label={streamQuality} variant="default" />
        </View>
      </Animated.View>

      {/* ─── Back Button ─── */}
      <View style={styles.backButton}>
        <VIconButton icon="←" onPress={handleBack} glass size="sm" />
      </View>

      {/* ─── Center: Room Code ─── */}
      {roomCode && isStreaming && (
        <Animated.View style={[styles.centerOverlay, { opacity: overlayOpacity }]}>
          <VGlass intensity={20} radius={radii.xl}>
            <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.7}>
              <View style={styles.roomCodeInner}>
                <Text style={styles.roomLabel}>Room Code</Text>
                <Text style={styles.roomCode}>{roomCode}</Text>
                <Text style={styles.roomHint}>Tap to copy</Text>
              </View>
            </TouchableOpacity>
          </VGlass>
        </Animated.View>
      )}

      {/* ─── Bottom: Floating Control Dock ─── */}
      {displayURL && (
        <Animated.View style={[styles.bottomDock, { opacity: controlsOpacity }]}>
          <VGlass intensity={28} radius={radii['3xl']}>
            <View style={styles.controlsRow}>
              <VIconButton
                icon={isFlashOn ? '🔦' : '💡'}
                label={!torchAvailable ? 'N/A' : isFlashOn ? 'On' : 'Flash'}
                onPress={handleToggleFlash}
                active={isFlashOn}
                disabled={isFrontCamera || !torchAvailable}
                glass
              />
              <VIconButton
                icon={isMicEnabled ? '🎙️' : '🔇'}
                label={isMicEnabled ? 'Mic' : 'Muted'}
                onPress={handleToggleMic}
                active={isMicEnabled}
                glass
              />
              <VIconButton
                icon="⏺️"
                label={isRecording ? fmt(recordingDuration) : 'Record'}
                onPress={handleToggleRecording}
                active={isRecording}
                danger={isRecording}
                glass
                size="lg"
              />
              <VIconButton
                icon="🔄"
                label="Flip"
                onPress={handleSwitchCamera}
                glass
              />
              {isStreaming ? (
                <VIconButton
                  icon="⏹️"
                  label="Stop"
                  onPress={handleStopStream}
                  danger
                  glass
                />
              ) : (
                <VIconButton
                  icon="📡"
                  label="Start"
                  onPress={handleStartStream}
                  active
                  glass
                />
              )}
            </View>
          </VGlass>
        </Animated.View>
      )}

      {/* ─── Talk-back indicator ─── */}
      {remoteStream && remoteStream.getAudioTracks().some((t: any) => t.enabled) && (
        <View style={styles.talkbackBadge}>
          <VBadge label="TALK-BACK" variant="info" icon="🎙️" />
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Placeholder (no stream)
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['8'],
  },
  placeholderTitle: {
    color: '#F1F5F9',
    fontSize: typography.size['2xl'],
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing['2'],
  },
  placeholderText: {
    color: '#64748B',
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },

  // Top overlay
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
  topLeft: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  topRight: {
    flexDirection: 'row',
    gap: spacing['2'],
    alignItems: 'center',
  },

  // Back button
  backButton: {
    position: 'absolute',
    top: 50,
    left: spacing['4'],
    zIndex: 20,
  },

  // Center overlay (room code)
  centerOverlay: {
    position: 'absolute',
    top: SCREEN_H * 0.35,
    alignSelf: 'center',
    zIndex: 10,
  },
  roomCodeInner: {
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
  },
  roomLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing['1'],
  },
  roomCode: {
    color: '#FFF',
    fontSize: typography.size['3xl'],
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 6,
  },
  roomHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: typography.size.xs,
    marginTop: spacing['1'],
  },

  // Bottom dock
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

  // Talk-back
  talkbackBadge: {
    position: 'absolute',
    bottom: spacing['20'] + spacing['10'],
    alignSelf: 'center',
    zIndex: 10,
  },
});
