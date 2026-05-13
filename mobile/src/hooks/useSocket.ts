/**
 * useSocket Hook
 * Manages Socket.IO connection lifecycle and event binding
 *
 * FIXED: createRoom emit, added comprehensive logging, flash command callback
 */

import { useCallback, useRef } from 'react';
import socketService from '../services/socketService';
import { useAppStore } from '../store/appStore';
import { SOCKET_EVENTS } from '../constants';
import type { CreateRoomResponse, JoinRoomResponse } from '../types';

export function useSocket() {
  const isConnectedRef = useRef(false);
  const onFlashCommandRef = useRef<((enabled: boolean) => void) | null>(null);
  const {
    setConnectionStatus,
    setRoomCode,
    setViewerCount,
    setIsStreaming,
    setBatteryInfo,
    setStreamQuality,
    setFlashOn,
    setError,
  } = useAppStore();

  // Connect to server
  const connect = useCallback(() => {
    if (isConnectedRef.current) {
      console.log('[useSocket] Already connected, skipping');
      return;
    }

    console.log('[useSocket] 🔌 Connecting to server...');
    setConnectionStatus('connecting');
    const socket = socketService.connect();

    socket.on('connect', () => {
      console.log('[useSocket] ✅ Socket connected! ID:', socket.id);
      isConnectedRef.current = true;
      setConnectionStatus('connected');

      // Phase 9: Auto-rejoin room after reconnection
      const { roomCode: activeRoom, mode } = useAppStore.getState();
      if (activeRoom) {
        console.log('[useSocket] 🔄 Reconnected — rejoining room:', activeRoom);
        socketService.emit(SOCKET_EVENTS.RECONNECT_TO_ROOM, {
          roomCode: activeRoom,
          role: mode || 'camera',
        });
      }
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[useSocket] ❌ Socket disconnected:', reason);
      isConnectedRef.current = false;
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (err: any) => {
      console.error('[useSocket] ❌ Connection error:', err?.message);
      setConnectionStatus('disconnected');
      setError('Failed to connect to server');
    });

    // Camera-specific events
    socket.on(SOCKET_EVENTS.VIEWER_CONNECTED, ({ viewerCount }: any) => {
      console.log('[useSocket] 👁️ Viewer connected, count:', viewerCount);
      setViewerCount(viewerCount);
    });

    socket.on(SOCKET_EVENTS.VIEWER_DISCONNECTED, ({ viewerCount }: any) => {
      console.log('[useSocket] 👁️ Viewer disconnected, count:', viewerCount);
      setViewerCount(viewerCount);
    });

    // Viewer-specific events
    socket.on(SOCKET_EVENTS.STREAM_STARTED, () => {
      console.log('[useSocket] 📡 Stream started (viewer notified)');
      setIsStreaming(true);
    });

    socket.on(SOCKET_EVENTS.STREAM_STOPPED, () => {
      console.log('[useSocket] ⏹️ Stream stopped (viewer notified)');
      setIsStreaming(false);
    });

    socket.on(SOCKET_EVENTS.CAMERA_OFFLINE, () => {
      console.log('[useSocket] 📷 Camera went offline');
      setConnectionStatus('disconnected');
      setIsStreaming(false);
      setError('Camera went offline');
    });

    socket.on(SOCKET_EVENTS.CAMERA_RECONNECTED, () => {
      console.log('[useSocket] 📷 Camera reconnected');
      setConnectionStatus('connected');
    });

    // Flash command (camera receives from viewer)
    socket.on(SOCKET_EVENTS.FLASH_COMMAND, ({ enabled }: any) => {
      console.log('[useSocket] 🔦 Flash command received:', enabled);
      setFlashOn(enabled);
      if (onFlashCommandRef.current) {
        onFlashCommandRef.current(enabled);
      }
    });

    // Status events
    socket.on(SOCKET_EVENTS.BATTERY_STATUS_UPDATE, ({ level, isCharging }: any) => {
      setBatteryInfo({ level, isCharging });
    });

    socket.on(SOCKET_EVENTS.QUALITY_UPDATE, ({ quality }: any) => {
      setStreamQuality(quality);
    });
  }, []);

  // Create room (camera mode)
  const createRoom = useCallback((): Promise<CreateRoomResponse> => {
    console.log('[useSocket] 🏠 Creating room...');
    return new Promise((resolve, reject) => {
      if (!socketService.isConnected()) {
        console.error('[useSocket] ❌ Cannot create room - not connected');
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      let resolved = false;

      // Timeout fallback
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('[useSocket] ⚠️ Create room timeout - no response after 10s');
          resolve({ success: false, error: 'Server timeout' });
        }
      }, 10000);

      // IMPORTANT: create-room takes NO data, just a callback
      socketService.emit(SOCKET_EVENTS.CREATE_ROOM, undefined, (response: CreateRoomResponse) => {
        if (resolved) return; // already timed out
        resolved = true;
        clearTimeout(timer);
        console.log('[useSocket] 🏠 Create room response:', JSON.stringify(response));
        if (response.success && response.roomCode) {
          console.log('[useSocket] ✅ Room created! Code:', response.roomCode);
          setRoomCode(response.roomCode);
        } else {
          console.error('[useSocket] ❌ Room creation failed:', response.error);
        }
        resolve(response);
      });
    });
  }, [setRoomCode]);

  // Join room (viewer mode)
  const joinRoom = useCallback((roomCode: string): Promise<JoinRoomResponse> => {
    console.log('[useSocket] 🚪 Joining room:', roomCode);
    return new Promise((resolve) => {
      if (!socketService.isConnected()) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socketService.emit(
        SOCKET_EVENTS.JOIN_ROOM,
        { roomCode },
        (response: JoinRoomResponse) => {
          console.log('[useSocket] 🚪 Join room response:', JSON.stringify(response));
          if (response.success && response.roomCode) {
            setRoomCode(response.roomCode);
            if (response.isStreaming) {
              setIsStreaming(true);
            }
          }
          resolve(response);
        }
      );

      setTimeout(() => {
        resolve({ success: false, error: 'Server timeout' });
      }, 10000);
    });
  }, [setRoomCode, setIsStreaming]);

  // Leave room
  const leaveRoom = useCallback(() => {
    console.log('[useSocket] 🚪 Leaving room');
    socketService.emit(SOCKET_EVENTS.LEAVE_ROOM);
    setRoomCode(null);
    setViewerCount(0);
  }, [setRoomCode, setViewerCount]);

  // Stream controls
  const startStream = useCallback(() => {
    console.log('[useSocket] 📡 Emitting start-stream');
    socketService.emit(SOCKET_EVENTS.START_STREAM);
    setIsStreaming(true);
  }, [setIsStreaming]);

  const stopStream = useCallback(() => {
    console.log('[useSocket] ⏹️ Emitting stop-stream');
    socketService.emit(SOCKET_EVENTS.STOP_STREAM);
    setIsStreaming(false);
  }, [setIsStreaming]);

  // Device controls
  const toggleFlash = useCallback((roomCode: string, enabled: boolean) => {
    console.log('[useSocket] 🔦 Toggle flash:', enabled, 'room:', roomCode);
    socketService.emit(SOCKET_EVENTS.TOGGLE_FLASH, { roomCode, enabled });
  }, []);

  const toggleMic = useCallback((roomCode: string, enabled: boolean) => {
    console.log('[useSocket] 🎙️ Toggle mic:', enabled);
    socketService.emit(SOCKET_EVENTS.TOGGLE_MIC, { roomCode, enabled });
  }, []);

  // Send battery status
  const sendBatteryStatus = useCallback((roomCode: string, level: number, isCharging: boolean) => {
    socketService.emit(SOCKET_EVENTS.BATTERY_STATUS, { roomCode, level, isCharging });
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    console.log('[useSocket] 🔌 Disconnecting...');
    socketService.disconnect();
    isConnectedRef.current = false;
    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  // Register flash command callback (camera mode)
  const setOnFlashCommand = useCallback((cb: (enabled: boolean) => void) => {
    onFlashCommandRef.current = cb;
  }, []);

  return {
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    startStream,
    stopStream,
    toggleFlash,
    toggleMic,
    sendBatteryStatus,
    setOnFlashCommand,
    isConnected: socketService.isConnected(),
  };
}
