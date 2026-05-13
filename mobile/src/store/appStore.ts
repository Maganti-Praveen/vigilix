/**
 * App Store (Zustand)
 * Global application state management
 */

import { create } from 'zustand';
import type {
  AppMode,
  ConnectionStatus,
  StreamQuality,
  VideoQualityPreset,
  BatteryInfo,
} from '../types';

interface AppState {
  // Mode
  mode: AppMode | null;
  setMode: (mode: AppMode | null) => void;

  // Room
  roomCode: string | null;
  setRoomCode: (code: string | null) => void;

  // Connection
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  // Stream
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;

  // Camera state
  isFrontCamera: boolean;
  toggleCamera: () => void;
  isFlashOn: boolean;
  setFlashOn: (on: boolean) => void;
  isMicEnabled: boolean;
  setMicEnabled: (enabled: boolean) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;

  // Viewer state
  viewerCount: number;
  setViewerCount: (count: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isTalkingBack: boolean;
  setIsTalkingBack: (talking: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;

  // Quality
  streamQuality: StreamQuality;
  setStreamQuality: (quality: StreamQuality) => void;

  // Battery
  batteryInfo: BatteryInfo | null;
  setBatteryInfo: (info: BatteryInfo | null) => void;

  // Settings
  videoQuality: VideoQualityPreset;
  setVideoQuality: (quality: VideoQualityPreset) => void;
  autoReconnect: boolean;
  setAutoReconnect: (enabled: boolean) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Reset
  resetState: () => void;
}

const initialState = {
  mode: null,
  roomCode: null,
  connectionStatus: 'disconnected' as ConnectionStatus,
  isStreaming: false,
  isFrontCamera: false,
  isFlashOn: false,
  isMicEnabled: true,
  isRecording: false,
  viewerCount: 0,
  isMuted: false,
  isTalkingBack: false,
  isFullscreen: false,
  streamQuality: 'good' as StreamQuality,
  batteryInfo: null,
  videoQuality: 'medium' as VideoQualityPreset,
  autoReconnect: true,
  error: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  toggleCamera: () => set((state) => ({ isFrontCamera: !state.isFrontCamera })),
  setFlashOn: (isFlashOn) => set({ isFlashOn }),
  setMicEnabled: (isMicEnabled) => set({ isMicEnabled }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setViewerCount: (viewerCount) => set({ viewerCount }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setIsTalkingBack: (isTalkingBack) => set({ isTalkingBack }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setStreamQuality: (streamQuality) => set({ streamQuality }),
  setBatteryInfo: (batteryInfo) => set({ batteryInfo }),
  setVideoQuality: (videoQuality) => set({ videoQuality }),
  setAutoReconnect: (autoReconnect) => set({ autoReconnect }),
  setError: (error) => set({ error }),
  resetState: () => set(initialState),
}));
