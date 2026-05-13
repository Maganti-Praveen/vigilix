/**
 * Permission Utilities
 * Handles camera and microphone permission requests
 */

import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';

/**
 * Request camera and microphone permissions on Android
 * @returns {Promise<boolean>} Whether all permissions were granted
 */
export async function requestCameraPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);

    const cameraGranted =
      grants[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
    const micGranted =
      grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

    if (!cameraGranted || !micGranted) {
      const missing = [];
      if (!cameraGranted) missing.push('Camera');
      if (!micGranted) missing.push('Microphone');

      Alert.alert(
        'Permissions Required',
        `Smart CCTV needs ${missing.join(' and ')} access to function properly. Please grant permissions in Settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Permissions] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Request storage permissions for recording
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestStoragePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  // Android 13+ uses granular media permissions
  if (Platform.Version >= 33) {
    try {
      const grant = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
      );
      return grant === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }

  try {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    ]);

    return (
      grants[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      grants[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}
