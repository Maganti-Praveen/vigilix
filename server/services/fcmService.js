/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles sending push notifications to wake up camera devices
 *
 * Uses Firebase Admin SDK with service account credentials
 * Credentials are passed via FIREBASE_SERVICE_ACCOUNT env var (JSON string)
 */

const admin = require('firebase-admin');

let initialized = false;

/**
 * Initialize Firebase Admin SDK
 * Uses service account from environment variable or file
 */
function initializeFirebase() {
  if (initialized) return;

  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountEnv) {
      // Parse from environment variable (for Render deployment)
      const serviceAccount = JSON.parse(serviceAccountEnv);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[FCM] ✅ Firebase initialized from environment variable');
    } else {
      // Try default credentials or check for local file
      try {
        const serviceAccount = require('../../vigilix6-firebase-adminsdk-fbsvc-ba23ee9b7f.json');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('[FCM] ✅ Firebase initialized from local file');
      } catch {
        console.warn('[FCM] ⚠️ No Firebase credentials found. Push notifications disabled.');
        return;
      }
    }

    initialized = true;
  } catch (error) {
    console.error('[FCM] ❌ Firebase initialization error:', error.message);
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
        title: '📹 Wake Up Camera',
        body: 'A viewer wants to connect to your camera',
      },
      android: {
        priority: 'high',
        ttl: 60 * 1000, // 60 seconds TTL
        notification: {
          channelId: 'wake_camera',
          priority: 'max',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`[FCM] ✅ Wake notification sent: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('[FCM] ❌ Send error:', error.message);

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
