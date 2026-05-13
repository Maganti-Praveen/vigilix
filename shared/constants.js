/**
 * Shared type definitions and constants
 * Used by both mobile app and server
 */

// Socket event names
const SOCKET_EVENTS = {
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
};

// Stream quality levels
const QUALITY_LEVELS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  WEAK: 'weak',
  RECONNECTING: 'reconnecting',
};

// WebRTC configuration
const WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

module.exports = {
  SOCKET_EVENTS,
  QUALITY_LEVELS,
  WEBRTC_CONFIG,
};
