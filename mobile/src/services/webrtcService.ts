/**
 * WebRTC Service
 * Manages peer connections, media streams, SDP exchange, and ICE candidates
 * Uses react-native-webrtc which has a slightly different API from browser WebRTC
 */

import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { WEBRTC_CONFIG, VIDEO_QUALITY_PRESETS } from '../constants';
import type { VideoQualityPreset } from '../types';

// react-native-webrtc uses event-based API with addEventListener
// and some properties differ from the W3C spec

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingICECandidates: any[] = [];

  // Callbacks
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onICECandidate: ((candidate: any) => void) | null = null;
  private onConnectionStateChange: ((state: string) => void) | null = null;
  private onDisconnected: (() => void) | null = null;

  /**
   * Set callback handlers
   */
  setCallbacks(callbacks: {
    onRemoteStream?: (stream: MediaStream) => void;
    onICECandidate?: (candidate: any) => void;
    onConnectionStateChange?: (state: string) => void;
    onDisconnected?: () => void;
  }) {
    this.onRemoteStream = callbacks.onRemoteStream ?? null;
    this.onICECandidate = callbacks.onICECandidate ?? null;
    this.onConnectionStateChange = callbacks.onConnectionStateChange ?? null;
    this.onDisconnected = callbacks.onDisconnected ?? null;
  }

  /**
   * Get local media stream (camera + microphone)
   */
  async getLocalStream(
    facingMode: 'user' | 'environment' = 'environment',
    quality: VideoQualityPreset = 'medium'
  ): Promise<MediaStream> {
    try {
      const preset = VIDEO_QUALITY_PRESETS[quality];

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode,
          width: { ideal: preset.width },
          height: { ideal: preset.height },
          frameRate: { ideal: preset.frameRate },
        },
      });

      this.localStream = stream as MediaStream;
      console.log('[WebRTC] Local stream obtained');
      return this.localStream;
    } catch (error) {
      console.error('[WebRTC] Error getting local stream:', error);
      throw error;
    }
  }

  /**
   * Get audio-only stream (viewer talk-back)
   * Gets microphone permission and creates an audio-only local stream
   * so the viewer can send their voice back to the camera device.
   * Audio starts muted — viewer must explicitly enable talk-back.
   */
  async getAudioOnlyStream(): Promise<MediaStream> {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.localStream = stream as MediaStream;

      // Start muted — viewer enables talk-back explicitly
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = false;
      });

      console.log('[WebRTC] 🎙️ Audio-only stream obtained (muted by default)');
      return this.localStream;
    } catch (error) {
      console.error('[WebRTC] Error getting audio stream:', error);
      throw error;
    }
  }

  /**
   * Create a new peer connection
   */
  createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      this.closePeerConnection();
    }

    this.peerConnection = new RTCPeerConnection(WEBRTC_CONFIG as any);

    // Handle ICE candidates — react-native-webrtc uses addEventListener
    this.peerConnection.addEventListener('icecandidate' as any, (event: any) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate generated');
        this.onICECandidate?.(event.candidate);
      }
    });

    // Handle remote stream — react-native-webrtc uses 'addstream' event
    this.peerConnection.addEventListener('addstream' as any, (event: any) => {
      console.log('[WebRTC] Remote stream received');
      if (event.stream) {
        this.remoteStream = event.stream;
        this.onRemoteStream?.(this.remoteStream!);
      }
    });

    // Also listen for track event (newer API)
    this.peerConnection.addEventListener('track' as any, (event: any) => {
      console.log('[WebRTC] Remote track received');
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStream?.(this.remoteStream!);
      }
    });

    // Handle ICE connection state changes
    this.peerConnection.addEventListener('iceconnectionstatechange' as any, () => {
      const state = this.peerConnection?.iceConnectionState ?? 'unknown';
      console.log('[WebRTC] ICE connection state:', state);
      this.onConnectionStateChange?.(state);

      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.onDisconnected?.();
      }
    });

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
      console.log('[WebRTC] Local tracks added to peer connection');
    }

    return this.peerConnection;
  }

  /**
   * Create an SDP offer (camera side)
   */
  async createOffer(): Promise<any> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      } as any);

      await this.peerConnection.setLocalDescription(offer as any);
      console.log('[WebRTC] Offer created and set as local description');
      return offer;
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error);
      throw error;
    }
  }

  /**
   * Create an SDP answer (viewer side)
   */
  async createAnswer(): Promise<any> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer as any);
      console.log('[WebRTC] Answer created and set as local description');
      return answer;
    } catch (error) {
      console.error('[WebRTC] Error creating answer:', error);
      throw error;
    }
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(sdp: any): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    try {
      const sessionDesc = new RTCSessionDescription(sdp);
      await this.peerConnection.setRemoteDescription(sessionDesc as any);
      console.log('[WebRTC] Remote description set');

      // Process any pending ICE candidates
      for (const candidate of this.pendingICECandidates) {
        await this.addICECandidate(candidate);
      }
      this.pendingICECandidates = [];
    } catch (error) {
      console.error('[WebRTC] Error setting remote description:', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   */
  async addICECandidate(candidate: any): Promise<void> {
    if (!this.peerConnection) {
      console.warn('[WebRTC] No peer connection, queuing ICE candidate');
      this.pendingICECandidates.push(candidate);
      return;
    }

    if (!this.peerConnection.remoteDescription) {
      console.log('[WebRTC] Remote description not set, queuing ICE candidate');
      this.pendingICECandidates.push(candidate);
      return;
    }

    try {
      const iceCandidate = new RTCIceCandidate(candidate);
      await this.peerConnection.addIceCandidate(iceCandidate as any);
    } catch (error) {
      console.error('[WebRTC] Error adding ICE candidate:', error);
    }
  }

  /**
   * Toggle audio track
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = enabled;
      });
      console.log(`[WebRTC] Audio ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Toggle video track
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = enabled;
      });
      console.log(`[WebRTC] Video ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Switch camera (front ↔ back)
   */
  async switchCamera(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack && typeof (videoTrack as any)._switchCamera === 'function') {
        (videoTrack as any)._switchCamera();
        console.log('[WebRTC] Camera switched');
      }
    }
  }

  /**
   * Toggle flashlight/torch on the camera
   * Uses react-native-webrtc's internal _setTorch() API
   */
  setTorch(enabled: boolean): boolean {
    if (!this.localStream) {
      console.warn('[WebRTC] Cannot toggle torch — no local stream');
      return false;
    }

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) {
      console.warn('[WebRTC] Cannot toggle torch — no video track');
      return false;
    }

    try {
      if (typeof (videoTrack as any)._setTorch === 'function') {
        (videoTrack as any)._setTorch(enabled);
        console.log(`[WebRTC] 🔦 Torch ${enabled ? 'ON' : 'OFF'}`);
        return true;
      } else {
        console.warn('[WebRTC] _setTorch not available on this track');
        return false;
      }
    } catch (error) {
      console.error('[WebRTC] Error toggling torch:', error);
      return false;
    }
  }

  /**
   * Check if torch/flashlight is supported on the current video track
   */
  isTorchSupported(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;
    return typeof (videoTrack as any)._setTorch === 'function';
  }

  /**
   * Get connection stats (parsed into structured format)
   */
  async getStats(): Promise<{
    bitrate?: number;
    packetLoss?: number;
    roundTripTime?: number;
    framesPerSecond?: number;
    resolution?: { width: number; height: number };
  } | null> {
    if (!this.peerConnection) return null;
    try {
      const stats = await this.peerConnection.getStats();
      const result: any = {};

      // react-native-webrtc returns a Map-like object
      if (stats && typeof stats.forEach === 'function') {
        stats.forEach((report: any) => {
          if (report.type === 'outbound-rtp' && report.kind === 'video') {
            result.bytesSent = report.bytesSent;
            result.framesPerSecond = report.framesPerSecond;
            result.frameWidth = report.frameWidth;
            result.frameHeight = report.frameHeight;
            if (report.frameWidth && report.frameHeight) {
              result.resolution = { width: report.frameWidth, height: report.frameHeight };
            }
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            result.roundTripTime = report.currentRoundTripTime;
          }
          if (report.type === 'remote-inbound-rtp') {
            result.packetLoss = report.packetsLost;
          }
        });
      }

      return result;
    } catch {
      return null;
    }
  }

  /**
   * Set maximum bitrate for the video sender (adaptive quality)
   */
  async setMaxBitrate(maxBitrate: number): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const senders = (this.peerConnection as any).getSenders();
      for (const sender of senders) {
        if (sender.track?.kind === 'video') {
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          params.encodings[0].maxBitrate = maxBitrate;
          await sender.setParameters(params);
          console.log(`[WebRTC] 📊 Max bitrate set to: ${Math.round(maxBitrate / 1000)}kbps`);
        }
      }
    } catch (error) {
      console.warn('[WebRTC] Error setting bitrate:', error);
    }
  }

  /**
   * Close peer connection
   */
  closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('[WebRTC] Peer connection closed');
    }
    this.pendingICECandidates = [];
  }

  /**
   * Stop local stream
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        track.stop();
      });
      this.localStream = null;
      console.log('[WebRTC] Local stream stopped');
    }
  }

  /**
   * Full cleanup
   */
  cleanup(): void {
    this.closePeerConnection();
    this.stopLocalStream();
    this.remoteStream = null;
    this.onRemoteStream = null;
    this.onICECandidate = null;
    this.onConnectionStateChange = null;
    this.onDisconnected = null;
    console.log('[WebRTC] Fully cleaned up');
  }

  /**
   * Get local stream reference
   */
  getLocalStreamRef(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream reference
   */
  getRemoteStreamRef(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Get peer connection reference
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }
}

export default new WebRTCService();
