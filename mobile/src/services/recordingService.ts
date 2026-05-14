/**
 * Recording Service
 * Manages recording state on the camera device.
 * Uses socket signaling to let the viewer control recording remotely.
 *
 * Architecture:
 * - Viewer sends "start-recording" / "stop-recording" commands via socket
 * - Camera captures frames and saves to local storage
 * - Recording metadata is synced to MongoDB via the API
 *
 * NOTE: React Native WebRTC doesn't have a built-in MediaRecorder.
 * For MVP, we track recording state + duration, and the actual
 * file capture is handled by native modules in a future release.
 * For now, we provide the full signaling infrastructure.
 */

import { AppState, Platform } from 'react-native';
import apiService from './apiService';

export interface RecordingState {
  isRecording: boolean;
  startTime: Date | null;
  duration: number;   // seconds
  filename: string | null;
  fileSize: number;
}

type RecordingListener = (state: RecordingState) => void;

class RecordingService {
  private state: RecordingState = {
    isRecording: false,
    startTime: null,
    duration: 0,
    filename: null,
    fileSize: 0,
  };

  private durationTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<RecordingListener> = new Set();

  /**
   * Start recording
   */
  start(cameraDeviceId?: string): void {
    if (this.state.isRecording) return;

    const now = new Date();
    const filename = `VLX_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.mp4`;

    this.state = {
      isRecording: true,
      startTime: now,
      duration: 0,
      filename,
      fileSize: 0,
    };

    // Duration counter
    this.durationTimer = setInterval(() => {
      if (this.state.startTime) {
        this.state.duration = Math.floor(
          (Date.now() - this.state.startTime.getTime()) / 1000
        );
        this.notifyListeners();
      }
    }, 1000);

    console.log(`[Recording] ▶️ Started: ${filename}`);
    this.notifyListeners();
  }

  /**
   * Stop recording and save metadata
   */
  async stop(cameraDeviceId?: string): Promise<RecordingState> {
    if (!this.state.isRecording) return this.state;

    // Stop timer
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }

    // Calculate final duration
    if (this.state.startTime) {
      this.state.duration = Math.floor(
        (Date.now() - this.state.startTime.getTime()) / 1000
      );
    }

    this.state.isRecording = false;

    const finalState = { ...this.state };

    console.log(`[Recording] ⏹️ Stopped: ${finalState.filename} (${finalState.duration}s)`);

    // Save recording metadata to server
    if (cameraDeviceId && finalState.filename) {
      try {
        await apiService.saveRecording({
          cameraDeviceId,
          filename: finalState.filename,
          filePath: `/storage/vigilix/${finalState.filename}`,
          fileSize: finalState.fileSize,
          duration: finalState.duration,
        });
        console.log('[Recording] 📤 Metadata saved to server');
      } catch (error) {
        console.warn('[Recording] Failed to save metadata:', error);
      }
    }

    this.notifyListeners();
    return finalState;
  }

  /**
   * Get current state
   */
  getState(): RecordingState {
    return { ...this.state };
  }

  /**
   * Format duration as MM:SS or HH:MM:SS
   */
  formatDuration(seconds?: number): string {
    const s = seconds ?? this.state.duration;
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Subscribe to state changes
   */
  addListener(listener: RecordingListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = { ...this.state };
    this.listeners.forEach(l => l(state));
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
    this.state = {
      isRecording: false,
      startTime: null,
      duration: 0,
      filename: null,
      fileSize: 0,
    };
    this.listeners.clear();
  }
}

export default new RecordingService();
