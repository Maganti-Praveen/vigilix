/**
 * Update Service — Vigilix
 * Self-hosted in-app update system.
 *
 * Since the app is not on Play Store, we check the server
 * for new versions and prompt the user to download the APK.
 *
 * Flow:
 * 1. App launches → checkForUpdate()
 * 2. Server returns { currentVersion, downloadUrl, changelog }
 * 3. If newer version available → show update dialog
 * 4. User taps "Update" → opens browser to download APK
 */

import { Alert, Linking, Platform } from 'react-native';
import { SERVER_URL } from '../constants';

// Current app version — bump this with each release
export const APP_VERSION = '1.1.0';
export const APP_VERSION_CODE = 2;

interface VersionInfo {
  currentVersion: string;
  versionCode: number;
  minSupportedVersion: string;
  releaseDate: string;
  downloadUrl: string;
  changelog: string[];
  updateRequired: boolean;
  updateAvailable: boolean;
}

class UpdateService {
  private lastCheckTime: number = 0;
  private CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // Check every 6 hours

  /**
   * Check for updates on the server
   * @param force - bypass time throttle
   */
  async checkForUpdate(force = false): Promise<void> {
    // Throttle: don't check more than once every 6 hours
    if (!force && (Date.now() - this.lastCheckTime) < this.CHECK_INTERVAL_MS) {
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/version`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return;

      const versionInfo: VersionInfo = await response.json();
      this.lastCheckTime = Date.now();

      // Compare versions
      if (this.isNewer(versionInfo.currentVersion, APP_VERSION)) {
        this.showUpdateDialog(versionInfo);
      }
    } catch (error) {
      // Silently fail — don't bother user if server is unreachable
      console.log('[Update] Check failed (server unreachable)');
    }
  }

  /**
   * Compare version strings (semver-like)
   */
  private isNewer(server: string, local: string): boolean {
    const s = server.split('.').map(Number);
    const l = local.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if ((s[i] || 0) > (l[i] || 0)) return true;
      if ((s[i] || 0) < (l[i] || 0)) return false;
    }
    return false; // same version
  }

  /**
   * Show update dialog to user
   */
  private showUpdateDialog(info: VersionInfo): void {
    const changelogText = info.changelog
      .map(c => `• ${c}`)
      .join('\n');

    const title = info.updateRequired
      ? '🔴 Update Required'
      : '🆕 Update Available';

    const message = `Vigilix v${info.currentVersion} is available!\n\nWhat's new:\n${changelogText}`;

    const buttons: any[] = [];

    if (!info.updateRequired) {
      buttons.push({ text: 'Later', style: 'cancel' });
    }

    buttons.push({
      text: 'Download Update',
      onPress: () => {
        Linking.openURL(info.downloadUrl).catch(() => {
          Alert.alert('Error', 'Could not open download link');
        });
      },
    });

    Alert.alert(title, message, buttons, {
      cancelable: !info.updateRequired,
    });
  }

  /**
   * Get current version info
   */
  getVersion(): { version: string; versionCode: number } {
    return {
      version: APP_VERSION,
      versionCode: APP_VERSION_CODE,
    };
  }
}

export default new UpdateService();
