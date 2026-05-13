/**
 * useWebRTC Hook
 * Manages WebRTC peer connection lifecycle for both camera and viewer modes
 *
 * FIXED:
 * - Socket signaling listeners now use socketService.on/off (always connected)
 *   instead of getSocket() which returned null before connect()
 * - Added comprehensive logging
 * - Fixed stale closure issue with mode/callbacks using refs
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { MediaStream } from 'react-native-webrtc';
import webrtcService from '../services/webrtcService';
import socketService from '../services/socketService';
import { useAppStore } from '../store/appStore';
import { SOCKET_EVENTS } from '../constants';
import type { VideoQualityPreset } from '../types';

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const { mode, setConnectionStatus, setError, autoReconnect } = useAppStore();
  const isCleanedUpRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxReconnectAttempts = 10;
  // Use refs to avoid stale closures in socket event handlers
  const modeRef = useRef(mode);
  modeRef.current = mode;

  /**
   * Initialize local media stream (camera mode)
   */
  const initLocalStream = useCallback(
    async (
      facingMode: 'user' | 'environment' = 'environment',
      quality: VideoQualityPreset = 'medium'
    ) => {
      try {
        console.log('[useWebRTC] 📷 Initializing local stream, facing:', facingMode);
        const stream = await webrtcService.getLocalStream(facingMode, quality);
        console.log('[useWebRTC] ✅ Local stream set, tracks:', stream.getTracks().length);
        setLocalStream(stream);
        return stream;
      } catch (error: any) {
        console.error('[useWebRTC] ❌ Camera error:', error.message);
        setError(`Camera error: ${error.message}`);
        throw error;
      }
    },
    []
  );

  /**
   * Start WebRTC as camera (creates offer when a viewer connects)
   */
  const startAsCamera = useCallback(
    async (viewerSocketId: string) => {
      try {
        console.log('[useWebRTC] 🎥 Starting as camera for viewer:', viewerSocketId);

        webrtcService.setCallbacks({
          onRemoteStream: (stream: MediaStream) => {
            console.log('[useWebRTC] 📥 Remote stream received (talk-back)');
            setRemoteStream(stream);
          },
          onICECandidate: (candidate: any) => {
            console.log('[useWebRTC] 🧊 Sending ICE candidate to viewer');
            socketService.emit(SOCKET_EVENTS.ICE_CANDIDATE, {
              targetSocketId: viewerSocketId,
              candidate,
            });
          },
          onConnectionStateChange: (state: string) => {
            console.log('[useWebRTC] 📶 Camera connection state:', state);
            if (state === 'connected' || state === 'completed') {
              setPeerConnected(true);
              setConnectionStatus('connected');
              setReconnectAttempt(0);
              // Boost audio bitrate for better voice quality
              webrtcService.setAudioBitrate(64000);
            } else if (state === 'failed') {
              setPeerConnected(false);
              setConnectionStatus('reconnecting');
              attemptICERestart();
            } else if (state === 'disconnected') {
              setPeerConnected(false);
              setConnectionStatus('reconnecting');
            }
          },
          onDisconnected: () => {
            console.log('[useWebRTC] ❌ Peer disconnected');
            setPeerConnected(false);
          },
        });

        console.log('[useWebRTC] 🔧 Creating peer connection...');
        webrtcService.createPeerConnection();

        console.log('[useWebRTC] 📋 Creating offer...');
        const offer = await webrtcService.createOffer();

        console.log('[useWebRTC] 📤 Sending offer to viewer:', viewerSocketId);
        socketService.emit(SOCKET_EVENTS.OFFER, {
          targetSocketId: viewerSocketId,
          sdp: offer,
        });

        console.log('[useWebRTC] ✅ Offer sent to viewer');
      } catch (error: any) {
        console.error('[useWebRTC] ❌ WebRTC camera error:', error.message);
        setError(`WebRTC error: ${error.message}`);
      }
    },
    []
  );

  /**
   * Start WebRTC as viewer (handles offer, creates answer)
   */
  const startAsViewer = useCallback(
    async (cameraSocketId: string, offer: any) => {
      try {
        console.log('[useWebRTC] 👁️ Starting as viewer for camera:', cameraSocketId);

        // Step 1: Get viewer's microphone for talk-back (starts muted)
        try {
          console.log('[useWebRTC] 🎙️ Getting viewer mic for talk-back...');
          const audioStream = await webrtcService.getAudioOnlyStream();
          setLocalStream(audioStream);
          console.log('[useWebRTC] ✅ Viewer mic ready (muted by default)');
        } catch (micError: any) {
          console.warn('[useWebRTC] ⚠️ Mic not available, talk-back disabled:', micError.message);
          // Continue without mic — viewer can still watch
        }

        webrtcService.setCallbacks({
          onRemoteStream: (stream: MediaStream) => {
            console.log('[useWebRTC] 📥 Remote stream received from camera');
            setRemoteStream(stream);
          },
          onICECandidate: (candidate: any) => {
            console.log('[useWebRTC] 🧊 Sending ICE candidate to camera');
            socketService.emit(SOCKET_EVENTS.ICE_CANDIDATE, {
              targetSocketId: cameraSocketId,
              candidate,
            });
          },
          onConnectionStateChange: (state: string) => {
            console.log('[useWebRTC] 📶 Viewer connection state:', state);
            if (state === 'connected' || state === 'completed') {
              setPeerConnected(true);
              setConnectionStatus('connected');
              setReconnectAttempt(0);
              // Boost audio bitrate for better voice quality
              webrtcService.setAudioBitrate(64000);
            } else if (state === 'failed') {
              setPeerConnected(false);
              setConnectionStatus('reconnecting');
              attemptICERestart();
            } else if (state === 'disconnected') {
              setPeerConnected(false);
              setConnectionStatus('reconnecting');
            }
          },
          onDisconnected: () => setPeerConnected(false),
        });

        // Step 2: Create peer connection (adds viewer's audio tracks automatically)
        webrtcService.createPeerConnection();
        await webrtcService.setRemoteDescription(offer);
        const answer = await webrtcService.createAnswer();

        socketService.emit(SOCKET_EVENTS.ANSWER, {
          targetSocketId: cameraSocketId,
          sdp: answer,
        });

        console.log('[useWebRTC] ✅ Answer sent to camera (with audio track for talk-back)');
      } catch (error: any) {
        console.error('[useWebRTC] ❌ WebRTC viewer error:', error.message);
        setError(`WebRTC error: ${error.message}`);
      }
    },
    []
  );

  /**
   * Handle incoming answer (camera side)
   */
  const handleAnswer = useCallback(async (sdp: any) => {
    try {
      console.log('[useWebRTC] 📥 Handling answer from viewer');
      await webrtcService.setRemoteDescription(sdp);
      console.log('[useWebRTC] ✅ Remote description set from answer');
    } catch (error: any) {
      console.error('[useWebRTC] ❌ Error handling answer:', error);
    }
  }, []);

  /**
   * Handle incoming ICE candidate
   */
  const handleICECandidate = useCallback(async (candidate: any) => {
    try {
      await webrtcService.addICECandidate(candidate);
    } catch (error: any) {
      console.error('[useWebRTC] ❌ Error adding ICE candidate:', error);
    }
  }, []);

  const toggleAudio = useCallback((enabled: boolean) => {
    webrtcService.toggleAudio(enabled);
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    webrtcService.toggleVideo(enabled);
  }, []);

  const switchCamera = useCallback(async () => {
    await webrtcService.switchCamera();
  }, []);

  const cleanup = useCallback(() => {
    if (isCleanedUpRef.current) return;
    isCleanedUpRef.current = true;
    console.log('[useWebRTC] 🧹 Cleaning up WebRTC');
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    webrtcService.cleanup();
    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnected(false);
    setReconnectAttempt(0);
  }, []);

  /**
   * Attempt ICE restart to recover a failed connection
   */
  const attemptICERestart = useCallback(async () => {
    if (isCleanedUpRef.current || !autoReconnect) return;

    setReconnectAttempt(prev => {
      const attempt = prev + 1;
      if (attempt > maxReconnectAttempts) {
        console.log('[useWebRTC] ❌ Max reconnect attempts reached');
        setError('Connection lost. Please rejoin the room.');
        setConnectionStatus('disconnected');
        return prev;
      }

      // Exponential backoff: 0s, 2s, 5s, 10s, 10s...
      const delays = [0, 2000, 5000, 10000];
      const delay = delays[Math.min(attempt - 1, delays.length - 1)];

      console.log(`[useWebRTC] 🔄 Reconnect attempt ${attempt}/${maxReconnectAttempts} in ${delay}ms`);

      reconnectTimerRef.current = setTimeout(async () => {
        try {
          const pc = webrtcService.getPeerConnection();
          if (pc && pc.iceConnectionState !== 'closed') {
            // Try ICE restart first
            console.log('[useWebRTC] 🧊 Attempting ICE restart...');
            const offer = await pc.createOffer({ iceRestart: true } as any);
            await pc.setLocalDescription(offer as any);

            // Send re-offer via signaling
            // The existing socket listeners will handle the answer
            console.log('[useWebRTC] 📤 ICE restart offer created');
          }
        } catch (error) {
          console.warn('[useWebRTC] ICE restart failed:', error);
        }
      }, delay);

      return attempt;
    });
  }, [autoReconnect, setError, setConnectionStatus]);

  // ─── Socket signaling listeners ────────────────────────────
  // Use socketService.on/off instead of getSocket() to ensure
  // listeners are registered even before socket connects.
  // Socket.IO buffers .on() calls and applies them once connected.
  useEffect(() => {
    isCleanedUpRef.current = false;
    console.log('[useWebRTC] 🔌 Setting up signaling listeners, mode:', mode);

    const handleViewerConnected = ({ viewerSocketId }: any) => {
      const currentMode = modeRef.current;
      console.log('[useWebRTC] 👁️ viewer-connected event received, viewerSocketId:', viewerSocketId, 'mode:', currentMode);
      if (currentMode === 'camera') {
        console.log('[useWebRTC] ✅ Mode is camera — initiating WebRTC with viewer');
        startAsCamera(viewerSocketId);
      } else {
        console.log('[useWebRTC] ⏭️ Ignoring viewer-connected (mode is:', currentMode, ')');
      }
    };

    const handleOffer = ({ sdp, senderSocketId }: any) => {
      const currentMode = modeRef.current;
      console.log('[useWebRTC] 📥 offer event received, from:', senderSocketId, 'mode:', currentMode);
      if (currentMode === 'viewer') {
        startAsViewer(senderSocketId, sdp);
      }
    };

    const handleAnswerEvent = ({ sdp }: any) => {
      const currentMode = modeRef.current;
      console.log('[useWebRTC] 📥 answer event received, mode:', currentMode);
      if (currentMode === 'camera') {
        handleAnswer(sdp);
      }
    };

    const handleICE = ({ candidate }: any) => {
      handleICECandidate(candidate);
    };

    // Register on the service — works even before socket is connected
    socketService.on(SOCKET_EVENTS.VIEWER_CONNECTED, handleViewerConnected);
    socketService.on(SOCKET_EVENTS.OFFER, handleOffer);
    socketService.on(SOCKET_EVENTS.ANSWER, handleAnswerEvent);
    socketService.on(SOCKET_EVENTS.ICE_CANDIDATE, handleICE);

    console.log('[useWebRTC] ✅ Signaling listeners registered');

    return () => {
      console.log('[useWebRTC] 🗑️ Removing signaling listeners');
      socketService.off(SOCKET_EVENTS.VIEWER_CONNECTED, handleViewerConnected);
      socketService.off(SOCKET_EVENTS.OFFER, handleOffer);
      socketService.off(SOCKET_EVENTS.ANSWER, handleAnswerEvent);
      socketService.off(SOCKET_EVENTS.ICE_CANDIDATE, handleICE);
    };
  }, [startAsCamera, startAsViewer, handleAnswer, handleICECandidate]);

  const setTorch = useCallback((enabled: boolean): boolean => {
    return webrtcService.setTorch(enabled);
  }, []);

  const isTorchSupported = useCallback((): boolean => {
    return webrtcService.isTorchSupported();
  }, []);

  const setMaxBitrate = useCallback(async (bitrate: number) => {
    await webrtcService.setMaxBitrate(bitrate);
  }, []);

  const getStats = useCallback(async () => {
    return await webrtcService.getStats();
  }, []);

  return {
    localStream,
    remoteStream,
    peerConnected,
    reconnectAttempt,
    initLocalStream,
    startAsCamera,
    startAsViewer,
    handleAnswer,
    handleICECandidate,
    toggleAudio,
    toggleVideo,
    switchCamera,
    setTorch,
    isTorchSupported,
    setMaxBitrate,
    getStats,
    cleanup,
  };
}
