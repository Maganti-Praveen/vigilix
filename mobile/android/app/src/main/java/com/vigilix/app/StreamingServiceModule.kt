package com.vigilix.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.util.Log

/**
 * Native module to control the foreground streaming service from React Native
 */
class StreamingServiceModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "StreamingService"

    @ReactMethod
    fun start(roomCode: String, promise: Promise) {
        try {
            StreamingForegroundService.start(reactApplicationContext, roomCode)
            Log.d("StreamingService", "Started foreground service for room: $roomCode")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("StreamingService", "Failed to start service", e)
            promise.reject("SERVICE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            StreamingForegroundService.stop(reactApplicationContext)
            Log.d("StreamingService", "Stopped foreground service")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("StreamingService", "Failed to stop service", e)
            promise.reject("SERVICE_ERROR", e.message)
        }
    }
}
