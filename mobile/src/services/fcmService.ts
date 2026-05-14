/**
 * FCM Service — Vigilix Mobile
 * Handles Firebase Cloud Messaging for push-to-wake functionality.
 *
 * Flow:
 * 1. On app launch → get FCM token → send to server
 * 2. When viewer sends "Wake" → server sends FCM to camera
 * 3. Camera receives push → opens app → auto-starts streaming
 */

import { Platform } from 'react-native';
import apiService from './apiService';

// Firebase messaging will be imported dynamically to handle missing module gracefully
let messaging: any = null;

async function getMessagingModule() {
  if (messaging) return messaging;
  try {
    const firebaseMessaging = require('@react-native-firebase/messaging');
    messaging = firebaseMessaging.default;
    return messaging;
  } catch (error) {
    console.warn('[FCM] Firebase messaging not available:', error);
    return null;
  }
}

class FCMService {
  private token: string | null = null;
  private unsubscribeOnMessage: (() => void) | null = null;
  private onWakeCallback: ((roomCode: string) => void) | null = null;

  /**
   * Initialize FCM — request permission and get token
   * Call this after user logs in
   */
  async initialize(): Promise<string | null> {
    try {
      const msg = await getMessagingModule();
      if (!msg) {
        console.warn('[FCM] Firebase messaging module not available');
        return null;
      }

      // Request permission
      const authStatus = await msg().requestPermission();
      const enabled =
        authStatus === 1 || // AUTHORIZED
        authStatus === 2;   // PROVISIONAL

      if (!enabled) {
        console.warn('[FCM] Permission not granted');
        return null;
      }

      // Get FCM token
      this.token = await msg().getToken();
      console.log('[FCM] ✅ Token:', this.token?.substring(0, 20) + '...');

      // Listen for token refresh
      msg().onTokenRefresh((newToken: string) => {
        console.log('[FCM] 🔄 Token refreshed');
        this.token = newToken;
        this.updateTokenOnServer(newToken);
      });

      // Listen for foreground messages
      this.unsubscribeOnMessage = msg().onMessage(async (remoteMessage: any) => {
        console.log('[FCM] 📩 Foreground message:', remoteMessage?.data);
        this.handleMessage(remoteMessage?.data);
      });

      // Handle background/quit messages
      msg().setBackgroundMessageHandler(async (remoteMessage: any) => {
        console.log('[FCM] 📩 Background message:', remoteMessage?.data);
        this.handleMessage(remoteMessage?.data);
      });

      return this.token;
    } catch (error: any) {
      console.error('[FCM] Initialize error:', error.message);
      return null;
    }
  }

  /**
   * Handle incoming FCM message
   */
  private handleMessage(data: any) {
    if (!data) return;

    if (data.action === 'wake') {
      console.log('[FCM] 🔔 WAKE command received! Room:', data.roomCode);
      if (this.onWakeCallback && data.roomCode) {
        this.onWakeCallback(data.roomCode);
      }
    }
  }

  /**
   * Register wake callback
   * Called when a "wake" push notification arrives
   */
  setOnWake(callback: (roomCode: string) => void) {
    this.onWakeCallback = callback;
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Update FCM token on server for a specific device
   */
  async updateTokenOnServer(token: string, deviceId?: string) {
    if (!token || !deviceId) return;
    try {
      await apiService.updateDeviceStatus(deviceId, { fcmToken: token });
      console.log('[FCM] Token updated on server');
    } catch (error) {
      console.warn('[FCM] Failed to update token on server:', error);
    }
  }

  /**
   * Register device with FCM token during device setup
   */
  async registerWithToken(deviceName: string, deviceModel: string, role: 'camera' | 'viewer') {
    const token = this.token || (await this.initialize());
    return apiService.registerDevice(deviceName, deviceModel, role, token || undefined);
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
      this.unsubscribeOnMessage = null;
    }
    this.onWakeCallback = null;
  }
}

export default new FCMService();
