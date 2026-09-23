package com.vigilix.app

import android.content.Context
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.util.Range
import android.view.Surface
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Native module to control foreground streaming service, hardware flashlight, and audio loudspeaker routing
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

    /**
     * Toggles the torch on an active WebRTC camera session by modifying the repeating
     * CaptureRequest in the running CameraCaptureSession via reflection.
     */
    private fun toggleWebRTCTorch(enabled: Boolean): Boolean {
        try {
            val webrtcClass = Class.forName("com.oney.WebRTCModule.WebRTCModule") as Class<out NativeModule>
            val webrtcModule = reactApplicationContext.getNativeModule(webrtcClass) ?: return false

            val getUserMediaField = webrtcModule.javaClass.getDeclaredField("getUserMediaImpl")
            getUserMediaField.isAccessible = true
            val getUserMediaImpl = getUserMediaField.get(webrtcModule) ?: return false

            val tracksField = getUserMediaImpl.javaClass.getDeclaredField("tracks")
            tracksField.isAccessible = true
            val tracks = tracksField.get(getUserMediaImpl) as? Map<*, *> ?: return false

            for (entry in tracks.values) {
                if (entry == null) continue
                var controllerField: java.lang.reflect.Field? = null
                var entryClass: Class<*>? = entry.javaClass
                while (entryClass != null && controllerField == null) {
                    try {
                        controllerField = entryClass.getDeclaredField("videoCaptureController")
                    } catch (e: NoSuchFieldException) {
                        entryClass = entryClass.superclass
                    }
                }
                if (controllerField == null) continue
                controllerField.isAccessible = true
                val controller = controllerField.get(entry) ?: continue

                var capturerField: java.lang.reflect.Field? = null
                var controllerClass: Class<*>? = controller.javaClass
                while (controllerClass != null && capturerField == null) {
                    try {
                        capturerField = controllerClass.getDeclaredField("videoCapturer")
                    } catch (e: NoSuchFieldException) {
                        controllerClass = controllerClass.superclass
                    }
                }
                if (capturerField == null) continue
                capturerField.isAccessible = true
                val videoCapturer = capturerField.get(controller) ?: continue

                var sessionField: java.lang.reflect.Field? = null
                var capturerClass: Class<*>? = videoCapturer.javaClass
                while (capturerClass != null && sessionField == null) {
                    try {
                        sessionField = capturerClass.getDeclaredField("currentSession")
                    } catch (e: NoSuchFieldException) {
                        capturerClass = capturerClass.superclass
                    }
                }
                if (sessionField == null) continue
                sessionField.isAccessible = true
                val session = sessionField.get(videoCapturer) ?: continue

                // 1. Camera2Session (standard in modern Android WebRTC)
                if (session.javaClass.name.contains("Camera2Session")) {
                    val sessionClass = session.javaClass

                    val captureSessionField = sessionClass.getDeclaredField("captureSession")
                    captureSessionField.isAccessible = true
                    val captureSession = captureSessionField.get(session) as? CameraCaptureSession

                    val cameraDeviceField = sessionClass.getDeclaredField("cameraDevice")
                    cameraDeviceField.isAccessible = true
                    val cameraDevice = cameraDeviceField.get(session) as? CameraDevice

                    val surfaceField = sessionClass.getDeclaredField("surface")
                    surfaceField.isAccessible = true
                    val surface = surfaceField.get(session) as? Surface

                    var cameraThreadHandler: Handler? = null
                    try {
                        val handlerField = sessionClass.getDeclaredField("cameraThreadHandler")
                        handlerField.isAccessible = true
                        cameraThreadHandler = handlerField.get(session) as? Handler
                    } catch (e: Exception) {
                        Log.d("StreamingService", "cameraThreadHandler reflection fallback: ${e.message}")
                    }

                    if (captureSession != null && cameraDevice != null && surface != null) {
                        val builder = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_RECORD)
                        builder.addTarget(surface)

                        try {
                            val formatField = sessionClass.getDeclaredField("captureFormat")
                            formatField.isAccessible = true
                            val captureFormat = formatField.get(session)
                            if (captureFormat != null) {
                                val framerateField = captureFormat.javaClass.getDeclaredField("framerate")
                                framerateField.isAccessible = true
                                val framerateRange = framerateField.get(captureFormat)
                                if (framerateRange != null) {
                                    val minField = framerateRange.javaClass.getDeclaredField("min")
                                    minField.isAccessible = true
                                    val maxField = framerateRange.javaClass.getDeclaredField("max")
                                    maxField.isAccessible = true
                                    val minVal = minField.getInt(framerateRange)
                                    val maxVal = maxField.getInt(framerateRange)

                                    val factorField = sessionClass.getDeclaredField("fpsUnitFactor")
                                    factorField.isAccessible = true
                                    val factor = factorField.getInt(session)
                                    val unitFactor = if (factor > 0) factor else 1000

                                    builder.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(minVal / unitFactor, maxVal / unitFactor))
                                }
                            }
                        } catch (e: Exception) {
                            Log.w("StreamingService", "Could not set FPS range for torch: ${e.message}")
                        }

                        builder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON)
                        builder.set(CaptureRequest.CONTROL_AE_LOCK, false)
                        builder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_VIDEO)

                        val mode = if (enabled) {
                            CaptureRequest.FLASH_MODE_TORCH
                        } else {
                            CaptureRequest.FLASH_MODE_OFF
                        }
                        builder.set(CaptureRequest.FLASH_MODE, mode)

                        if (cameraThreadHandler != null) {
                            cameraThreadHandler.post {
                                try {
                                    captureSession.setRepeatingRequest(builder.build(), null, cameraThreadHandler)
                                    Log.i("StreamingService", "Active WebRTC Camera2 torch applied on camera thread: $enabled")
                                } catch (e: Exception) {
                                    Log.e("StreamingService", "Error applying repeating request on camera thread", e)
                                }
                            }
                        } else {
                            captureSession.setRepeatingRequest(builder.build(), null, null)
                        }

                        Log.i("StreamingService", "Active WebRTC Camera2 torch toggled to: $enabled")
                        return true
                    }
                }

                // 2. Camera1Session (legacy Android fallback)
                if (session.javaClass.name.contains("Camera1Session")) {
                    var sessionClass: Class<*>? = session.javaClass
                    var cameraField: java.lang.reflect.Field? = null
                    while (sessionClass != null && cameraField == null) {
                        try {
                            cameraField = sessionClass.getDeclaredField("camera")
                        } catch (e: NoSuchFieldException) {
                            sessionClass = sessionClass.superclass
                        }
                    }
                    if (cameraField != null) {
                        cameraField.isAccessible = true
                        val camera = cameraField.get(session) as? android.hardware.Camera
                        if (camera != null) {
                            val params = camera.parameters
                            val flashModes = params.supportedFlashModes
                            val mode = if (enabled) {
                                if (flashModes != null && flashModes.contains(android.hardware.Camera.Parameters.FLASH_MODE_TORCH)) {
                                    android.hardware.Camera.Parameters.FLASH_MODE_TORCH
                                } else {
                                    android.hardware.Camera.Parameters.FLASH_MODE_ON
                                }
                            } else {
                                android.hardware.Camera.Parameters.FLASH_MODE_OFF
                            }
                            params.flashMode = mode
                            camera.parameters = params
                            Log.i("StreamingService", "Active WebRTC Camera1 torch toggled to: $mode")
                            return true
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.i("StreamingService", "toggleWebRTCTorch notice: ${e.message}")
        }
        return false
    }

    /**
     * Controls device physical torch / flashlight LED.
     * First checks for active WebRTC camera session, then falls back to CameraManager.
     */
    @ReactMethod
    fun setTorch(enabled: Boolean, promise: Promise) {
        try {
            Log.i("StreamingService", "setTorch called with enabled=$enabled")
            // Priority 1: If WebRTC camera session is actively running, toggle via session request
            if (toggleWebRTCTorch(enabled)) {
                promise.resolve(true)
                return
            }

            // Priority 2: Standalone CameraManager (when camera is not actively streaming)
            val cameraManager = reactApplicationContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager
            for (id in cameraManager.cameraIdList) {
                val characteristics = cameraManager.getCameraCharacteristics(id)
                val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
                val facing = characteristics.get(CameraCharacteristics.LENS_FACING)
                if (hasFlash && facing == CameraCharacteristics.LENS_FACING_BACK) {
                    cameraManager.setTorchMode(id, enabled)
                    Log.d("StreamingService", "Torch mode set to $enabled for camera $id via CameraManager")
                    promise.resolve(true)
                    return
                }
            }
            // Fallback: any camera with flash
            for (id in cameraManager.cameraIdList) {
                val characteristics = cameraManager.getCameraCharacteristics(id)
                if (characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true) {
                    cameraManager.setTorchMode(id, enabled)
                    Log.d("StreamingService", "Fallback torch mode set to $enabled for camera $id")
                    promise.resolve(true)
                    return
                }
            }
            promise.resolve(false)
        } catch (e: Exception) {
            Log.e("StreamingService", "Error setting torch mode", e)
            promise.reject("TORCH_ERROR", e.message)
        }
    }

    /**
     * Checks if physical flash is supported on this device
     */
    @ReactMethod
    fun isTorchSupported(promise: Promise) {
        try {
            val cameraManager = reactApplicationContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager
            for (id in cameraManager.cameraIdList) {
                val characteristics = cameraManager.getCameraCharacteristics(id)
                if (characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true) {
                    promise.resolve(true)
                    return
                }
            }
            promise.resolve(false)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    /**
     * Forces Android to route WebRTC audio output to the LOUDSPEAKER (bottom speaker)
     * and sets both voice call and media volume to MAX so talk-back plays loud like YouTube
     */
    @ReactMethod
    fun setSpeakerphone(enabled: Boolean, promise: Promise) {
        try {
            val audioManager = reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            
            val applyAudioRouting = {
                try {
                    audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                    audioManager.isSpeakerphoneOn = enabled

                    if (enabled) {
                        val maxCallVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL)
                        audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, maxCallVol, 0)

                        val maxMusicVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
                        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, maxMusicVol, 0)

                        val maxSystemVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_SYSTEM)
                        audioManager.setStreamVolume(AudioManager.STREAM_SYSTEM, maxSystemVol, 0)
                        Log.i("StreamingService", "Loudspeaker enforced: speakerphone=$enabled, callVol=$maxCallVol, musicVol=$maxMusicVol")
                    }
                } catch (e: Exception) {
                    Log.w("StreamingService", "Error applying audio routing: ${e.message}")
                }
            }

            applyAudioRouting()

            // WebRTC can asynchronously reset audio routing when an audio track initializes.
            // Re-enforce speakerphone after 200ms and 600ms to keep volume like YouTube.
            if (enabled) {
                val mainHandler = Handler(Looper.getMainLooper())
                mainHandler.postDelayed({ applyAudioRouting() }, 200)
                mainHandler.postDelayed({ applyAudioRouting() }, 600)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("StreamingService", "Error configuring loudspeaker", e)
            promise.reject("AUDIO_ERROR", e.message)
        }
    }
}
