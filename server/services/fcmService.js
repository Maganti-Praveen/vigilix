/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles sending push notifications to wake up camera devices
 *
 * Uses Firebase Admin SDK with service account credentials
 * Credentials are passed via FIREBASE_SERVICE_ACCOUNT env var (JSON string)
 */

const admin = require('firebase-admin');

const path = require('path');
const fs = require('fs');

let initialized = false;

/**
 * Initialize Firebase Admin SDK
 * Uses service account from environment variable or file
 */
function initializeFirebase() {
  if (initialized) return;

  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const defaultLocalPath = path.join(__dirname, '../../vigilix6-firebase-adminsdk-fbsvc-ba23ee9b7f.json');

    let serviceAccount = null;

    if (serviceAccountEnv) {
      // Parse from environment variable (for Render deployment)
      serviceAccount = JSON.parse(serviceAccountEnv);
      console.log('[FCM] Loaded credentials from FIREBASE_SERVICE_ACCOUNT env var');
    } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(path.resolve(serviceAccountPath));
      console.log(`[FCM] Loaded credentials from path: ${serviceAccountPath}`);
    } else if (fs.existsSync(defaultLocalPath)) {
      serviceAccount = require(defaultLocalPath);
      console.log(`[FCM] Loaded credentials from local file: ${path.basename(defaultLocalPath)}`);
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`[FCM] Firebase Admin initialized for project: ${serviceAccount.project_id || 'unknown'}`);
      initialized = true;
    } else {
      console.warn('[FCM] No FIREBASE_SERVICE_ACCOUNT found. Push notifications disabled.');
    }
  } catch (error) {
    console.error('[FCM] Firebase initialization error:', error.message);
  }
}

/**
 * Send a wake-up push notification to a camera device
 * @param {string} fcmToken - The device's FCM token
 * @param {string} roomCode - The room code to connect to
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendWakeNotification(fcmToken, roomCode) {
  if (!initialized) {
    initializeFirebase();
    if (!initialized) {
      return { success: false, error: 'Firebase not initialized' };
    }
  }

  if (!fcmToken) {
    return { success: false, error: 'No FCM token provided' };
  }

  try {
    const message = {
      token: fcmToken,
      // Data message (handled by app even when killed)
      data: {
        action: 'wake',
        roomCode: roomCode || '',
        timestamp: Date.now().toString(),
      },
      // Notification for visual feedback
      notification: {
        title: 'Wake Up Camera',
        body: 'A viewer wants to connect to your camera',
      },
      android: {
        priority: 'high',
        ttl: 60 * 1000, // 60 seconds TTL
        notification: {
          channelId: 'wake_camera',
          priority: 'max',
          sound: 'default',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`[FCM] Wake notification sent: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('[FCM] Send error:', error.message);

    // Handle token expiry
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      return { success: false, error: 'Device token expired', tokenExpired: true };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple devices
 */
async function sendMulticast(tokens, data) {
  if (!initialized) {
    initializeFirebase();
    if (!initialized) return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const message = {
      tokens,
      data,
      android: { priority: 'high' },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Multicast: ${response.successCount} sent, ${response.failureCount} failed`);
    return { success: true, successCount: response.successCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Initialize on module load
initializeFirebase();

module.exports = {
  initializeFirebase,
  sendWakeNotification,
  sendMulticast,
};
