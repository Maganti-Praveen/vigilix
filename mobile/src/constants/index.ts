/**
 * Socket event name constants
 * Mirrored from shared/constants.js for TypeScript
 */

export const SOCKET_EVENTS = {
  // Room
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',

  // Stream
  START_STREAM: 'start-stream',
  STOP_STREAM: 'stop-stream',
  STREAM_STARTED: 'stream-started',
  STREAM_STOPPED: 'stream-stopped',

  // WebRTC
  OFFER: 'offer',
  ANSWER: 'answer',
  ICE_CANDIDATE: 'ice-candidate',

  // Viewers
  VIEWER_CONNECTED: 'viewer-connected',
  VIEWER_DISCONNECTED: 'viewer-disconnected',

  // Camera control
  TOGGLE_FLASH: 'toggle-flash',
  FLASH_COMMAND: 'flash-command',
  SWITCH_CAMERA: 'switch-camera',
  CAMERA_SWITCH_COMMAND: 'camera-switch-command',
  TOGGLE_MIC: 'toggle-mic',
  MIC_TOGGLED: 'mic-toggled',

  // Recording
  START_RECORDING: 'start-recording',
  STOP_RECORDING: 'stop-recording',
  RECORDING_COMMAND: 'recording-command',

  // Status
  CAMERA_ONLINE: 'camera-online',
  CAMERA_OFFLINE: 'camera-offline',
  CAMERA_RECONNECTED: 'camera-reconnected',
  BATTERY_STATUS: 'battery-status',
  BATTERY_STATUS_UPDATE: 'battery-status-update',
  STREAM_QUALITY_UPDATE: 'stream-quality-update',
  QUALITY_UPDATE: 'quality-update',

  // Reconnection
  RECONNECT_TO_ROOM: 'reconnect-to-room',
} as const;

export const WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// Server URL — change for production
export const SERVER_URL = "http://192.168.31.53:3001";

export const QUALITY_LEVELS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  WEAK: 'weak',
  RECONNECTING: 'reconnecting',
} as const;

export const VIDEO_QUALITY_PRESETS = {
  low: { width: 640, height: 480, frameRate: 15, bitrate: 300000 },
  medium: { width: 1280, height: 720, frameRate: 24, bitrate: 800000 },
  high: { width: 1920, height: 1080, frameRate: 30, bitrate: 1500000 },
} as const;
