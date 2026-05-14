/**
 * Permission Service
 * Handles camera, microphone, and notification permission requests
 * with deny flows, retry flows, and settings redirect
 */

import { Platform, Alert, Linking } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';

interface PermissionResult {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  allGranted: boolean;
}

class PermissionService {

  /**
   * Request camera + microphone permissions
   * Shows explanation dialogs and handles deny/blocked cases
   */
  async requestCameraPermissions(): Promise<PermissionResult> {
    try {
      // On Android, getUserMedia triggers the permission dialog
      // We test by actually requesting a stream
      const stream = await (global as any).navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Permissions granted — stop the test stream
      stream.getTracks().forEach((track: any) => track.stop());

      return {
        camera: 'granted',
        microphone: 'granted',
        allGranted: true,
      };
    } catch (error: any) {
      const errorMsg = error.message || '';

      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        // User denied — show explanation
        return this.handleDeniedPermission();
      }

      if (errorMsg.includes('Permission permanently denied')) {
        return this.handleBlockedPermission();
      }

      // Other error (no camera hardware, etc.)
      console.warn('[Permissions] Camera error:', errorMsg);
      return {
        camera: 'denied',
        microphone: 'denied',
        allGranted: false,
      };
    }
  }

  /**
   * Handle denied permission — show explanation and offer retry
   */
  private handleDeniedPermission(): Promise<PermissionResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Permissions Required',
        'Vigilix needs camera and microphone access to stream video and enable talk-back audio.\n\nWithout these permissions, the app cannot function.',
        [
          {
            text: 'Open Settings',
            onPress: () => {
              this.openAppSettings();
              resolve({ camera: 'blocked', microphone: 'blocked', allGranted: false });
            },
          },
          {
            text: 'Try Again',
            onPress: async () => {
              const result = await this.requestCameraPermissions();
              resolve(result);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              resolve({ camera: 'denied', microphone: 'denied', allGranted: false });
            },
          },
        ]
      );
    });
  }

  /**
   * Handle permanently blocked permissions — redirect to settings
   */
  private handleBlockedPermission(): Promise<PermissionResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Permissions Blocked',
        'Camera and microphone permissions have been permanently denied.\n\nPlease enable them in your device settings to use Vigilix.',
        [
          {
            text: 'Open Settings',
            onPress: () => {
              this.openAppSettings();
              resolve({ camera: 'blocked', microphone: 'blocked', allGranted: false });
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              resolve({ camera: 'blocked', microphone: 'blocked', allGranted: false });
            },
          },
        ]
      );
    });
  }

  /**
   * Open app settings page
   */
  openAppSettings(): void {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      Linking.openURL('app-settings:');
    }
  }

  /**
   * Show battery optimization warning
   * Important for background streaming
   */
  showBatteryOptimizationWarning(): void {
    Alert.alert(
      'Battery Optimization',
      'For uninterrupted background streaming, please disable battery optimization for Vigilix.\n\nThis prevents Android from killing the app when the screen is off.',
      [
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'android') {
              // Open battery optimization settings
              Linking.openSettings();
            }
          },
        },
        { text: 'Later', style: 'cancel' },
      ]
    );
  }
}

export default new PermissionService();
