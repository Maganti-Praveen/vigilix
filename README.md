<p align="center">
  <img src="mobile/assets/vigilix-logo.png" alt="Vigilix" width="120" height="120" style="border-radius: 24px;" />
</p>

<h1 align="center">Vigilix</h1>

<p align="center">
  <strong>Transform any Android smartphone into an enterprise-grade smart security camera.</strong>
</p>

<p align="center">
  Real-time P2P WebRTC streaming · Two-way talk-back audio · Camera2 hardware flashlight · Remote FCM wake-up
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.2.0-blue" alt="Version 1.2.0" />
  <img src="https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/React_Native-Expo_SDK_54-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/WebRTC-P2P-FF6600?logo=webrtc&logoColor=white" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## Live Deployment

- **Production Signaling Server & Web Command Center:** [https://vigilix.onrender.com/](https://vigilix.onrender.com/)
- **Latest Android Release APK:** `Vigilix-v1.2.0.apk`

---

## Overview

Vigilix is an open-source mobile surveillance platform that repurposes spare Android smartphones into secure, high-definition smart security cameras. By utilizing native WebRTC peer-to-peer protocols, video and audio streams transfer directly between the camera node and viewers without routing through intermediary servers.

### Core Capabilities

- **Camera Mode:** Converts any Android device into an ultra-low latency streaming node with background support.
- **Viewer Mode:** Connects to live camera streams on other Android devices or via the web viewer using a secure 6-character room code.
- **Two-Way Talk-Back Audio:** Delivers high-gain, loudspeaker audio communication using native audio stream routing and Web Audio API dynamic range compression.
- **Camera Switching:** Enables live toggling between front-facing and environment back cameras during an ongoing stream without peer reconnection.
- **Camera2 Hardware Torch:** Uses Android native reflection on the active camera session to trigger hardware flashlights without camera conflicts.
- **Remote Push-to-Wake (FCM):** Transmits high-priority Firebase Cloud Messaging data packets to wake backgrounded or idle camera devices on demand.
- **Web Command Center:** Provides a dark glassmorphic desktop interface featuring real-time stream playback, hardware control toggles, and live connection metrics.
- **Battery Optimization:** Tracks battery levels and charging states, automatically adjusting bitrates when running on low battery reserves.

---

## Architecture

```
   Camera Device                           Viewer Device / Web Browser
   +----------------------+                +----------------------+
   | Camera & Audio Track | <== WebRTC ==> | Video & Audio Player |
   | Capture & Encoding   |     (P2P)      | Dynamic Pre-Amp Mic  |
   +----------+-----------+                +----------+-----------+
              |                                       |
              | Socket.IO Signaling                   | Socket.IO Signaling
              v                                       v
   +--------------------------------------------------------------+
   |                  Vigilix Signaling Server                    |
   |              Node.js + Express + Socket.IO                   |
   |         (Room brokering, SDP exchange, FCM wake)             |
   +--------------------------------------------------------------+
```

1. **Room Initialization:** The camera connects to the signaling server and creates a 6-character room code.
2. **Viewer Handshake:** The viewer requests to join the room using the code.
3. **P2P Establishment:** The signaling server brokers SDP offer/answer exchanges and ICE candidates. Once connected, media flows directly between nodes.
4. **Zero Media Relaying:** Video and audio data are strictly peer-to-peer; no media packets pass through or get stored on the server.

---

## Technology Stack

| Component | Technologies |
|-----------|--------------|
| Mobile Application | React Native, Expo SDK 54, TypeScript, Native Kotlin |
| Media Engine | WebRTC (`react-native-webrtc`), DTLS-SRTP encryption |
| Signaling Server | Node.js, Express, Socket.IO 4.x |
| Persistence & Database | MongoDB via Mongoose, JWT authentication, BCrypt |
| Remote Push Notifications | Firebase Cloud Messaging (FCM) via Firebase Admin SDK |
| Hardware Abstraction | Android Camera2 API, AudioManager, WakeLock, KeepAwake |
| Web Dashboard | Vanilla JavaScript (ES6+), Web Audio API, Responsive Glassmorphism |

---

## Features Breakdown

### Camera Node
- Live camera preview with hardware-accelerated rendering.
- Seamless front and back camera switching with fixed resolution and framerate constraints.
- Native repeating request torch control directly on active camera threads.
- Foreground service integration with persistent notifications for uninterrupted background streaming.
- Adaptive bitrate scaling (300 kbps to 1.5 Mbps) based on network conditions and battery level.
- Hardware wake-lock and screen keep-awake controls.

### Viewer & Web Command Center
- Fullscreen low-latency playback with configurable aspect ratios.
- Pre-amplified push-to-talk microphone pipeline with Web Audio DynamicsCompressor and 350% gain boost.
- Remote hardware toggles for camera switching and flashlight.
- Remote recording triggers and clip management.
- Real-time battery, charging, and WebRTC connection telemetry.
- Push-to-wake trigger for offline registered cameras.

---

## Project Structure

```
vigilix/
├── mobile/                      Mobile application (React Native / Expo)
│   ├── android/                 Android native project (Kotlin modules & Gradle)
│   ├── assets/                  App icons, splash graphics, and branding assets
│   ├── src/
│   │   ├── components/          Glassmorphic design system and UI elements
│   │   ├── constants/           Configuration, endpoints, and quality presets
│   │   ├── hooks/               WebRTC and Socket.IO React hooks
│   │   ├── screens/             Camera, Viewer, Home, Auth, and Settings views
│   │   ├── services/            Native hardware, WebRTC, API, and FCM services
│   │   └── store/               Zustand application state stores
│   ├── app.json                 Expo application configuration (v1.2.0)
│   └── package.json
├── server/                      Backend signaling & management service
│   ├── middleware/              JWT authentication and request validation
│   ├── models/                  MongoDB Device and User schemas
│   ├── public/                  Web Command Center dashboard (viewer.html)
│   ├── routes/                  REST endpoints (auth, devices, recordings, version)
│   ├── services/                Room manager and Firebase Cloud Messaging service
│   ├── socket/                  Socket.IO WebRTC signaling handlers
│   ├── index.js                 Main server entry point
│   └── package.json
├── shared/                      Shared protocol events and constants
├── CONTRIBUTING.md              Contribution guidelines
├── LICENSE                      MIT License
└── README.md                    Project documentation
```

---

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm 9.x or higher
- Android Studio with Android SDK Platform 34 or higher
- Physical Android phone for WebRTC camera testing

### 1. Signaling Server Setup

```bash
cd server
npm install

# Configure environment variables
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/vigilix
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=*
```

Start the signaling server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 2. Mobile Application Setup

```bash
cd mobile
npm install

# Connect physical device via ADB
adb devices

# Forward server and Metro ports
adb reverse tcp:3001 tcp:3001
adb reverse tcp:8081 tcp:8081

# Run on Android device
npx expo run:android
```

---

## Building the Release APK (Version 1.2.0)

To produce an optimized standalone release APK:

```bash
cd mobile/android
./gradlew assembleRelease
```

The compiled release APK is generated at:
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

To install directly to a connected device:
```bash
adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## Security and Privacy

- **Direct End-to-End Encryption:** All WebRTC media streams are encrypted using DTLS (Datagram Transport Layer Security) and SRTP (Secure Real-Time Transport Protocol).
- **Zero Video Retention:** No media streams, frames, or audio buffers pass through or are saved on the signaling server.
- **Ephemeral Room Codes:** Room sessions expire automatically following 30 minutes of inactivity.
- **Secure Token Authentication:** Device registration and remote wake-up endpoints are protected with JSON Web Tokens (JWT) and BCrypt password hashing.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
