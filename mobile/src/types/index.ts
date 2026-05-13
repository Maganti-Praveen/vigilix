/**
 * TypeScript type definitions for Smart CCTV app
 */

export type AppMode = 'camera' | 'viewer';

export type CameraPosition = 'front' | 'back';

export type StreamQuality = 'excellent' | 'good' | 'weak' | 'reconnecting';

export type VideoQualityPreset = 'low' | 'medium' | 'high';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface RoomInfo {
  code: string;
  isStreaming: boolean;
  cameraSocketId?: string;
  viewerCount?: number;
}

export interface CreateRoomResponse {
  success: boolean;
  roomCode?: string;
  error?: string;
  message?: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomCode?: string;
  isStreaming?: boolean;
  cameraSocketId?: string;
  error?: string;
  message?: string;
}

export interface BatteryInfo {
  level: number;
  isCharging: boolean;
}

export interface StreamQualityInfo {
  quality: StreamQuality;
  bitrate?: number;
  fps?: number;
  resolution?: string;
}

export interface ViewerInfo {
  socketId: string;
  joinedAt: number;
}

export interface WebRTCOffer {
  sdp: RTCSessionDescriptionInit;
  senderSocketId: string;
}

export interface WebRTCAnswer {
  sdp: RTCSessionDescriptionInit;
  senderSocketId: string;
}

export interface ICECandidateMessage {
  candidate: RTCIceCandidateInit;
  senderSocketId: string;
}

export interface AppSettings {
  videoQuality: VideoQualityPreset;
  autoReconnect: boolean;
  keepAwake: boolean;
  darkMode: boolean;
}
