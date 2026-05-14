/**
 * Background Service
 * Manages foreground notification and keep-alive for camera streaming
 * when the app is backgrounded or screen is off.
 *
 * Uses expo-notifications to show a persistent notification
 * and AppState to track foreground/background transitions.
 */

import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

class BackgroundService {
  private isRunning = false;
  private appStateSubscription: any = null;
  private notificationId: string | null = null;
  private onBackgroundCallback: (() => void) | null = null;
  private onForegroundCallback: (() => void) | null = null;
  private startTime: Date | null = null;
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start background service with persistent notification
   * Call this when camera starts streaming
   */
  async start(options?: {
    roomCode?: string;
    onBackground?: () => void;
    onForeground?: () => void;
  }): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = new Date();
    this.onBackgroundCallback = options?.onBackground || null;
    this.onForegroundCallback = options?.onForeground || null;

    // Request notification permission
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[BackgroundService] Notification permission not granted');
    }

    // Show persistent notification
    await this.showStreamingNotification(options?.roomCode);

    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );

    // Update notification every 30 seconds with duration
    this.updateInterval = setInterval(() => {
      this.updateNotification(options?.roomCode);
    }, 30000);

    console.log('[BackgroundService] ✅ Started');
  }

  /**
   * Stop background service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.startTime = null;

    // Remove notification
    if (this.notificationId) {
      await Notifications.dismissNotificationAsync(this.notificationId);
      this.notificationId = null;
    }

    // Remove all our notifications
    await Notifications.dismissAllNotificationsAsync();

    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.onBackgroundCallback = null;
    this.onForegroundCallback = null;

    console.log('[BackgroundService] 🛑 Stopped');
  }

  /**
   * Handle app state transitions
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    console.log(`[BackgroundService] App state: ${nextAppState}`);

    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background — streaming continues via WebRTC
      console.log('[BackgroundService] 📱 App backgrounded — stream continues');
      this.onBackgroundCallback?.();
    } else if (nextAppState === 'active') {
      // App returning to foreground
      console.log('[BackgroundService] 📱 App foregrounded');
      this.onForegroundCallback?.();
    }
  }

  /**
   * Show persistent streaming notification
   */
  private async showStreamingNotification(roomCode?: string): Promise<void> {
    try {
      // Set up the notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('streaming', {
          name: 'Camera Streaming',
          importance: Notifications.AndroidImportance.LOW,
          sound: undefined,
          vibrationPattern: [0],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      this.notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📹 Vigilix Camera Active',
          body: roomCode
            ? `Streaming · Room: ${roomCode}`
            : 'Camera is streaming...',
          sticky: true,
          priority: Notifications.AndroidNotificationPriority.LOW,
          ...(Platform.OS === 'android' && { channelId: 'streaming' }),
        },
        trigger: null, // show immediately
      });

      console.log('[BackgroundService] 📋 Notification shown');
    } catch (error) {
      console.warn('[BackgroundService] Notification error:', error);
    }
  }

  /**
   * Update notification with streaming duration
   */
  private async updateNotification(roomCode?: string): Promise<void> {
    if (!this.isRunning || !this.startTime) return;

    const duration = this.getStreamingDuration();

    try {
      // Dismiss old and show new (expo-notifications doesn't support update)
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
      }

      this.notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📹 Vigilix Camera Active',
          body: roomCode
            ? `Streaming ${duration} · Room: ${roomCode}`
            : `Streaming ${duration}`,
          sticky: true,
          priority: Notifications.AndroidNotificationPriority.LOW,
          ...(Platform.OS === 'android' && { channelId: 'streaming' }),
        },
        trigger: null,
      });
    } catch {
      // Ignore update errors
    }
  }

  /**
   * Get formatted streaming duration
   */
  private getStreamingDuration(): string {
    if (!this.startTime) return '';
    const diff = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  /**
   * Check if background service is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

export default new BackgroundService();
