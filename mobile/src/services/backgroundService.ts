/**
 * Background Service
 * Manages native foreground service + notification for camera streaming
 * when the app is backgrounded or screen is off.
 *
 * On Android: Uses native StreamingForegroundService (Kotlin) with PARTIAL_WAKE_LOCK
 * Fallback: Uses expo-notifications for persistent notification
 */

import { AppState, AppStateStatus, NativeModules, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const { StreamingService } = NativeModules;

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

    // Start native foreground service (Android)
    if (Platform.OS === 'android' && StreamingService) {
      try {
        await StreamingService.start(options?.roomCode || '');
        console.log('[BackgroundService] ✅ Native foreground service started');
      } catch (error) {
        console.warn('[BackgroundService] Native service failed, using fallback:', error);
        await this.showFallbackNotification(options?.roomCode);
      }
    } else {
      // iOS or native module not available — use expo-notifications
      await this.showFallbackNotification(options?.roomCode);
    }

    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );

    console.log('[BackgroundService] ✅ Started');
  }

  /**
   * Stop background service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.startTime = null;

    // Stop native foreground service
    if (Platform.OS === 'android' && StreamingService) {
      try {
        await StreamingService.stop();
      } catch (error) {
        console.warn('[BackgroundService] Stop native service error:', error);
      }
    }

    // Remove any expo notifications
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
      console.log('[BackgroundService] 📱 App backgrounded — stream continues');
      this.onBackgroundCallback?.();
    } else if (nextAppState === 'active') {
      console.log('[BackgroundService] 📱 App foregrounded');
      this.onForegroundCallback?.();
    }
  }

  /**
   * Fallback: show expo-notifications based persistent notification
   */
  private async showFallbackNotification(roomCode?: string): Promise<void> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('streaming', {
          name: 'Camera Streaming',
          importance: Notifications.AndroidImportance.LOW,
          sound: undefined,
          vibrationPattern: [0],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📹 Vigilix Camera Active',
          body: roomCode ? `Streaming · Room: ${roomCode}` : 'Camera is streaming...',
          sticky: true,
          priority: Notifications.AndroidNotificationPriority.LOW,
          ...(Platform.OS === 'android' && { channelId: 'streaming' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.warn('[BackgroundService] Fallback notification error:', error);
    }
  }

  /**
   * Check if background service is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get streaming duration string
   */
  getStreamingDuration(): string {
    if (!this.startTime) return '';
    const diff = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }
}

export default new BackgroundService();
