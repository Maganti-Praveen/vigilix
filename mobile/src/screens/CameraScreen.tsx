/**
 * CameraScreen — Vigilix
 * Immersive fullscreen camera with floating glassmorphic controls.
 * The most important screen in the app.
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Alert, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator, AppState, BackHandler,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import * as Battery from 'expo-battery';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../design/ThemeContext';
import { spacing, radii, typography } from '../design/tokens';
import { useAppStore } from '../store/appStore';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import {
  Camera, Radio, Eye, ChevronLeft, Zap, Flashlight,
  Mic, MicOff, CircleDot, Circle, SwitchCamera, Square,
  Battery as BatteryIcon,
} from 'lucide-react-native';
import { VIconButton } from '../components/ui/VIconButton';
import { VBadge } from '../components/ui/VBadge';
import { VGlass } from '../components/ui/VGlass';
import { VButton } from '../components/ui/VButton';
import * as Clipboard from 'expo-clipboard';
import backgroundService from '../services/backgroundService';
import recordingService from '../services/recordingService';
import hardwareService from '../services/hardwareService';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface CameraScreenProps {
  onBack: () => void;
}

export function CameraScreen({ onBack }: CameraScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [batteryLevel, setBatteryLevel] = useState<number>(84);

  const {
    roomCode, isStreaming, isFrontCamera, isFlashOn,
    isMicEnabled, isRecording, viewerCount, connectionStatus,
    streamQuality, videoQuality, setFlashOn, setMicEnabled, setIsRecording,
    setIsFrontCamera, toggleCamera, setMode, setStreamQuality, setError, error,
  } = useAppStore();

  const {
    connect, createRoom, startStream, stopStream, leaveRoom, disconnect,
    sendBatteryStatus, setOnFlashCommand, setOnCameraSwitchCommand, setOnRecordingCommand,
    toggleFlash,
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
          if (level >= 0) setBatteryLevel(Math.round(level * 100));
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

  // ─── Control handlers ─────────────────────────────────────────
  const handleFlashCommand = useCallback(async (enabled: boolean) => {
    console.log('[CameraScreen] Flash command received:', enabled);
    if (isFrontCamera && enabled) {
      console.warn('[CameraScreen] Flash not supported on front camera');
      return;
    }
    const ok = await setTorch(enabled);
    if (ok || !enabled) {
      setFlashOn(enabled);
    }
  }, [isFrontCamera, setTorch, setFlashOn]);

  const handleToggleFlash = useCallback(async () => {
    if (isFrontCamera) return;
    const nextState = !isFlashOn;
    console.log('[CameraScreen] handleToggleFlash toggling to:', nextState);
    const ok = await setTorch(nextState);
    if (ok || !nextState) {
      setFlashOn(nextState);
      if (roomCode) {
        toggleFlash(roomCode, nextState);
      }
    }
  }, [isFlashOn, isFrontCamera, setTorch, setFlashOn, roomCode, toggleFlash]);

  const handleToggleMic = useCallback(() => {
    setMicEnabled(!isMicEnabled);
    toggleAudio(!isMicEnabled);
  }, [isMicEnabled, setMicEnabled, toggleAudio]);

  const handleSwitchCamera = useCallback(async (targetType?: string) => {
    console.log('[CameraScreen] handleSwitchCamera triggered, targetType:', targetType);
    let nextIsFront: boolean;
    if (targetType) {
      nextIsFront = targetType === 'front' || targetType === 'user';
      if (nextIsFront === isFrontCamera) {
        console.log('[CameraScreen] Already on requested camera:', targetType);
        return;
      }
    } else {
      nextIsFront = !isFrontCamera;
    }

    if (isFlashOn) {
      await setTorch(false);
      setFlashOn(false);
    }

    setIsFrontCamera(nextIsFront);
    const facing = nextIsFront ? 'user' : 'environment';
    await switchCamera(facing);
    setTimeout(async () => {
      const supported = await isTorchSupported();
      setTorchAvailable(supported);
    }, 500);
  }, [isFrontCamera, setIsFrontCamera, switchCamera, isFlashOn, setTorch, setFlashOn, isTorchSupported]);

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

  const handleFlashCommandRef = useRef(handleFlashCommand);
  handleFlashCommandRef.current = handleFlashCommand;

  const handleSwitchCameraRef = useRef(handleSwitchCamera);
  handleSwitchCameraRef.current = handleSwitchCamera;

  // ─── Mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    setMode('camera');

    // Ensure loudspeaker is engaged at max volume
    hardwareService.setSpeakerphone(true).catch(() => {});

    // Remote flash command from viewer
    setOnFlashCommand((enabled: boolean) => {
      handleFlashCommandRef.current?.(enabled);
    });

    // Remote camera switch command from viewer
    setOnCameraSwitchCommand((cameraType?: string) => {
      handleSwitchCameraRef.current?.(cameraType);
    });

    // Direct socketService listener backups to guarantee remote commands are never dropped
    const onDirectFlash = (data: any) => {
      const enabled = typeof data === 'object' && data !== null ? Boolean(data.enabled) : Boolean(data);
      console.log('[CameraScreen] Direct socket flash-command received:', enabled);
      handleFlashCommandRef.current?.(enabled);
    };
    const onDirectSwitch = (data: any) => {
      const cameraType = typeof data === 'object' && data !== null ? data.cameraType : data;
      console.log('[CameraScreen] Direct socket camera-switch-command received:', cameraType);
      handleSwitchCameraRef.current?.(cameraType);
    };

    socketService.on(SOCKET_EVENTS.FLASH_COMMAND, onDirectFlash);
    socketService.on(SOCKET_EVENTS.CAMERA_SWITCH_COMMAND, onDirectSwitch);

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
      socketService.off(SOCKET_EVENTS.FLASH_COMMAND, onDirectFlash);
      socketService.off(SOCKET_EVENTS.CAMERA_SWITCH_COMMAND, onDirectSwitch);
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
        isFrontCamera ? 'user' : 'environment',
        videoQuality
      );
      setStreamURL(stream.toURL());
      setTimeout(async () => {
        const supported = await isTorchSupported();
        setTorchAvailable(supported);
      }, 500);
      hardwareService.setSpeakerphone(true).catch(() => {});
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
  }, [isFrontCamera, videoQuality, initLocalStream, createRoom, startStream, isTorchSupported, setError]);

  // ─── Stop stream ───────────────────────────────────────────────
  const handleStopStream = useCallback(() => {
    if (isRecording && recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setRecordingDuration(0);
    }
    if (isFlashOn) { setTorch(false).catch(() => {}); setFlashOn(false); }
    backgroundService.stop();
    stopStream(); leaveRoom(); cleanupWebRTC();
    setStreamURL(null); setTorchAvailable(false); setError(null);
  }, [stopStream, leaveRoom, cleanupWebRTC, isRecording, isFlashOn, setTorch, setFlashOn]);

  // ─── Hardware back button handling ────────────────────────────
  useEffect(() => {
    const onBackPress = () => {
      if (isStreaming) {
        Alert.alert(
          'Stop Streaming',
          'Are you sure you want to stop streaming and exit?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            {
              text: 'Exit',
              style: 'destructive',
              onPress: () => {
                handleStopStream();
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
  }, [isStreaming, handleStopStream, onBack]);

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
              <Camera size={44} color="#4F8EF7" style={{ marginBottom: spacing['4'] }} />
              <Text style={styles.placeholderTitle}>Camera Ready</Text>
              <Text style={styles.placeholderText}>
                {connectionStatus === 'connected'
                  ? 'Tap Start to begin streaming'
                  : 'Connecting to server…'}
              </Text>
              <View style={{ marginTop: spacing['8'], width: '70%' }}>
                <VButton
                  title="Start Streaming"
                  icon={<Radio size={20} color="#FFF" />}
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

      {/* ─── Top HUD Overlay matching reference ─── */}
      <View style={[styles.liveTop, { top: Math.max(insets.top + 8, 20) }]}>
        <View style={styles.hudLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            style={styles.hudBackButton}
          >
            <ChevronLeft size={16} color="#FFF" />
          </TouchableOpacity>

          {isRecording ? (
            <View style={[styles.hudPill, styles.hudRecPill]}>
              <View style={styles.redDot} />
              <Text style={styles.hudRecText}>REC {fmt(recordingDuration)}</Text>
            </View>
          ) : isStreaming ? (
            <View style={[styles.hudPill, styles.hudLivePill]}>
              <View style={styles.greenDot} />
              <Text style={styles.hudLiveText}>LIVE</Text>
            </View>
          ) : null}

          {isStreaming && (
            <View style={styles.hudPill}>
              <Eye size={11} color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} />
              <Text style={styles.hudText}>
                {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
              </Text>
            </View>
          )}
        </View>

        {/* Right HUD: Battery & Resolution */}
        <View style={styles.hudPill}>
          <BatteryIcon size={11} color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} />
          <Text style={styles.hudText}>
            {batteryLevel}% · {streamQuality || '720p'}
          </Text>
        </View>
      </View>

      {/* ─── Center Room Code Floating Pill ─── */}
      {roomCode && isStreaming && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCopyCode}
          style={[styles.centerRoomPill, { top: Math.max(insets.top + 14, 26) }]}
        >
          <Text style={styles.centerRoomText}>ROOM / {roomCode}</Text>
        </TouchableOpacity>
      )}

      {/* ─── Center Reticle & Waiting Pill (when peer not connected) ─── */}
      {isStreaming && !peerConnected && (
        <View style={styles.liveCenter} pointerEvents="none">
          <View style={styles.reticle}>
            <View style={styles.reticleH} />
            <View style={styles.reticleV} />
          </View>
          <View style={styles.waitPill}>
            <Text style={styles.waitText}>Waiting for viewer connection</Text>
          </View>
        </View>
      )}

      {/* ─── Talk-Back Active Indicator ─── */}
      {remoteStream && remoteStream.getAudioTracks().some((t: any) => t.enabled) && (
        <View style={styles.talkbackBanner}>
          <View style={styles.greenDot} />
          <Text style={styles.talkbackText}>Two-way audio receiving</Text>
        </View>
      )}

      {/* ─── Bottom Floating 5-Button Dock matching reference ─── */}
      {displayURL && (
        <Animated.View
          style={[
            styles.controlsDock,
            {
              bottom: Math.max(insets.bottom + 16, 24),
              opacity: controlsOpacity,
            },
          ]}
        >
          {/* 1. Flashlight */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleToggleFlash}
            disabled={isFrontCamera}
            style={[
              styles.ctl,
              isFlashOn && styles.ctlActive,
              isFrontCamera && styles.ctlDisabled,
            ]}
          >
            {isFlashOn ? (
              <Zap size={20} color="#FBBF24" />
            ) : (
              <Flashlight size={20} color="#FFF" />
            )}
          </TouchableOpacity>

          {/* 2. Switch Camera */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSwitchCamera()}
            style={styles.ctl}
          >
            <SwitchCamera size={20} color="#FFF" />
          </TouchableOpacity>

          {/* 3. Mic Toggle */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleToggleMic}
            style={[styles.ctl, !isMicEnabled && styles.ctlMuted]}
          >
            {isMicEnabled ? (
              <Mic size={20} color="#6F9CFF" />
            ) : (
              <MicOff size={20} color="#FF6F74" />
            )}
          </TouchableOpacity>

          {/* 4. Record Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleToggleRecording}
            style={[styles.ctl, isRecording && styles.ctlRecording]}
          >
            {isRecording ? (
              <CircleDot size={20} color="#FF6F74" />
            ) : (
              <Circle size={20} color="#FFF" />
            )}
          </TouchableOpacity>

          {/* 5. Stop Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleStopStream}
            style={[styles.ctl, styles.ctlStop]}
          >
            <Square size={16} color="#FF6F74" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05080D',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['6'],
  },
  placeholderTitle: {
    color: '#F4F5F7',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  placeholderText: {
    color: '#9299A3',
    fontSize: 13,
    textAlign: 'center',
  },
  liveTop: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  hudLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudBackButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(4, 8, 13, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(4, 8, 13, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  hudRecPill: {
    borderColor: 'rgba(217, 85, 94, 0.4)',
    backgroundColor: 'rgba(217, 85, 94, 0.18)',
  },
  hudLivePill: {
    borderColor: 'rgba(34, 164, 106, 0.4)',
    backgroundColor: 'rgba(34, 164, 106, 0.18)',
  },
  hudText: {
    fontSize: 10,
    color: '#E7EBF2',
    fontWeight: '600',
  },
  hudRecText: {
    fontSize: 10,
    color: '#FF6F74',
    fontWeight: '700',
  },
  hudLiveText: {
    fontSize: 10,
    color: '#56D493',
    fontWeight: '700',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6F74',
    marginRight: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#56D493',
    marginRight: 5,
  },
  centerRoomPill: {
    position: 'absolute',
    alignSelf: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(4, 8, 13, 0.70)',
    zIndex: 10,
  },
  centerRoomText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
  liveCenter: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  reticleH: {
    position: 'absolute',
    width: 26,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  reticleV: {
    position: 'absolute',
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  waitPill: {
    marginTop: 14,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(5, 9, 14, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  waitText: {
    fontSize: 10,
    color: '#DFE4EB',
    fontWeight: '500',
  },
  talkbackBanner: {
    position: 'absolute',
    bottom: 95,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(6, 14, 25, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(57, 118, 255, 0.4)',
    zIndex: 10,
  },
  talkbackText: {
    fontSize: 10,
    color: '#6F9CFF',
    fontWeight: '600',
  },
  controlsDock: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 9, 14, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  ctl: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctlActive: {
    backgroundColor: 'rgba(111, 156, 255, 0.22)',
    borderColor: 'rgba(111, 156, 255, 0.55)',
  },
  ctlMuted: {
    backgroundColor: 'rgba(255, 111, 116, 0.15)',
    borderColor: 'rgba(255, 111, 116, 0.35)',
  },
  ctlRecording: {
    backgroundColor: 'rgba(255, 111, 116, 0.22)',
    borderColor: 'rgba(255, 111, 116, 0.55)',
  },
  ctlStop: {
    backgroundColor: 'rgba(255, 111, 116, 0.18)',
    borderColor: 'rgba(255, 111, 116, 0.40)',
  },
  ctlDisabled: {
    opacity: 0.35,
  },
});
