package com.vigilix.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * StreamingForegroundService
 * Keeps the camera streaming even when the app is backgrounded or screen is off.
 * Uses a persistent notification to prevent Android from killing the process.
 */
class StreamingForegroundService : Service() {

    companion object {
        private const val TAG = "StreamingService"
        private const val CHANNEL_ID = "vigilix_streaming"
        private const val NOTIFICATION_ID = 1001

        fun start(context: Context, roomCode: String? = null) {
            val intent = Intent(context, StreamingForegroundService::class.java).apply {
                putExtra("roomCode", roomCode)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, StreamingForegroundService::class.java))
        }
    }

    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        Log.d(TAG, "Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val roomCode = intent?.getStringExtra("roomCode") ?: ""

        // Build notification
        val notification = buildNotification(roomCode)
        startForeground(NOTIFICATION_ID, notification)

        // Acquire wake lock to prevent CPU sleep
        acquireWakeLock()

        Log.d(TAG, "Service started with room: $roomCode")
        return START_STICKY // Restart if killed
    }

    override fun onDestroy() {
        releaseWakeLock()
        Log.d(TAG, "Service stopped")
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Camera Streaming",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when Vigilix camera is streaming"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(roomCode: String): Notification {
        // Tap notification → open app
        val openIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val body = if (roomCode.isNotEmpty()) {
            "Streaming · Room: $roomCode"
        } else {
            "Camera is streaming..."
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("📹 Vigilix Camera Active")
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Vigilix::StreamingWakeLock"
        ).apply {
            acquire(12 * 60 * 60 * 1000L) // 12 hours max
        }
        Log.d(TAG, "Wake lock acquired")
    }

    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
                Log.d(TAG, "Wake lock released")
            }
        }
        wakeLock = null
    }
}
