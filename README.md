<p align="center">
  <img src="mobile/assets/vigilix-logo.png" alt="Vigilix" width="120" height="120" style="border-radius: 24px;" />
</p>

<h1 align="center">Vigilix</h1>

<p align="center">
  <strong>Transform any Android phone into a smart security camera.</strong>
</p>

<p align="center">
  Real-time P2P streaming · Bidirectional audio · Zero cloud dependency
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/React_Native-Expo_SDK_54-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/WebRTC-P2P-FF6600?logo=webrtc&logoColor=white" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
</p>

---

## What is Vigilix?

Vigilix is an open-source mobile surveillance platform that turns old Android phones into smart home security cameras with **real-time peer-to-peer streaming**.

No cloud. No subscription. No data leaves your network.

- 📱 **Camera Mode** — Turn any phone into a security camera
- 👁️ **Viewer Mode** — Watch live from another phone or browser
- 🎙️ **Talk-Back** — Two-way audio communication
- 🔦 **Remote Control** — Toggle flashlight remotely
- 🔋 **Battery Aware** — Auto-optimizes quality on low battery
- 🌐 **Web Viewer** — Watch from any browser on your network

---

## How It Works

```
   📱 Camera Phone                         📱 Viewer / 💻 Browser
   ┌─────────────┐                         ┌──────────────────┐
   │  Captures    │ ◄───── WebRTC P2P ────►│  Displays        │
   │  Video+Audio │    (direct, encrypted)  │  Live Stream     │
   └──────┬──────┘                         └────────┬─────────┘
          │                                         │
          │  Socket.IO                    Socket.IO  │
          └──────────►┌──────────────┐◄─────────────┘
                      │   Signaling   │
                      │    Server     │
                      │  (room codes, │
                      │   SDP relay)  │
                      └──────────────┘
```

1. **Camera** starts streaming → gets a 6-character room code
2. **Viewer** enters the code → server brokers the WebRTC handshake
3. **Direct P2P** connection established — video streams device-to-device
4. Server only relays signaling — **zero video passes through the server**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 📱 Mobile App | React Native · Expo SDK 54 · TypeScript |
| 🎥 Streaming | WebRTC (react-native-webrtc) · P2P · Bidirectional |
| 📡 Signaling | Socket.IO 4.x · Node.js · Express |
| 🎨 UI System | Custom Design System · Inter Font · Dark/Light Themes |
| 🔄 State | Zustand |
| 🌐 Web Viewer | Vanilla JS · WebRTC · Glassmorphism UI |
| 🔋 Native APIs | expo-battery · expo-keep-awake · expo-blur |

---

## Features

### 📷 Camera Mode
- Live camera preview with RTCView
- One-tap streaming with auto-generated room code
- Front/back camera switching
- Hardware flashlight with capability detection
- Microphone toggle
- Recording timer & indicator
- Adaptive bitrate (auto-adjusts to network conditions)
- Battery monitoring with low-power optimization
- Keep-awake during streaming
- Auto-reconnect with exponential backoff

### 👁️ Viewer Mode
- Clean room code input with validation
- Full-screen live stream viewing
- Two-way audio (talk-back)
- Remote flashlight control
- Camera battery status display
- Connection quality indicator
- Auto-reconnect + auto-rejoin room

### 🌐 Web Viewer
- Beautiful dark glassmorphism interface
- WebRTC streaming in the browser
- Talk-back microphone (HTTPS only)
- Screenshot capture & download
- Fullscreen mode
- Remote flash toggle
- Battery status display
- Connection event log

### 🎨 Design System
- Premium Apple-like UI
- Full dark + light theme support
- Inter typography
- Frosted glass (expo-blur) controls
- Smooth animations (fade, slide, scale, pulse)
- Reusable component library (VButton, VCard, VBadge, VGlass, VIconButton)

---

## Quick Start

### Prerequisites

- Node.js 18+
- Android Studio with SDK 36
- Physical Android phone with USB debugging
- Computer and phone on the same WiFi

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/vigilix.git
cd vigilix

# Server
cd server && npm install && cd ..

# Mobile
cd mobile && npm install && cd ..
```

### 2. Configure Network

Find your computer's IP:
```bash
hostname -I | awk '{print $1}'
```

Update `mobile/src/constants/index.ts`:
```typescript
export const SERVER_URL = "http://YOUR_IP:3001";
```

### 3. Start Server

```bash
cd server && npm run dev
```

### 4. Build & Run App

```bash
cd mobile && npx expo run:android
```

> ⏱️ First build takes ~15 minutes. After that, use `npx expo start --dev-client`

### 5. Web Viewer

Open in any browser on your network:
```
http://YOUR_IP:3001/viewer.html
```

---

## Project Structure

```
vigilix/
│
├── 📱 mobile/                    React Native Expo App
│   ├── App.tsx                   Entry point + navigation
│   ├── assets/                   App icon, splash, logo
│   └── src/
│       ├── design/               Design system
│       │   ├── tokens.ts         Colors, typography, spacing
│       │   ├── themes.ts         Light + Dark themes
│       │   ├── ThemeContext.tsx   Theme provider
│       │   └── animations.ts     Animation hooks
│       ├── components/
│       │   ├── ui/               VButton, VCard, VBadge, VGlass...
│       │   └── navigation/       BottomTabBar
│       ├── screens/              Splash, Home, Camera, Viewer, Settings
│       ├── hooks/                useSocket, useWebRTC, usePermissions
│       ├── services/             socketService, webrtcService
│       ├── store/                Zustand global state
│       ├── constants/            Socket events, STUN config
│       └── types/                TypeScript definitions
│
├── 🖥️ server/                    Node.js Signaling Server
│   ├── index.js                  Express + Socket.IO entry
│   ├── socket/handlers.js        15+ socket event handlers
│   ├── services/roomManager.js   Room CRUD + lifecycle
│   ├── routes/api.js             REST health/stats endpoints
│   ├── utils/roomCode.js         Unique code generator
│   └── public/viewer.html        Web viewer (605 lines)
│
└── 📦 shared/                    Shared constants
    └── constants.js
```

---

## Deployment

### Deploy Server to Render (Free)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect repo, set:
   - **Root Directory**: `server`
   - **Build**: `npm install`
   - **Start**: `node index.js`
   - **Plan**: Free
4. Update `SERVER_URL` in mobile app to the Render URL

### Build APK

```bash
cd mobile
npx eas build --platform android --profile preview
```

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **WebRTC P2P** | Zero-latency, no cloud video processing costs |
| **Socket.IO** | Reliable signaling with auto-reconnect and fallback transports |
| **Zustand** | Minimal boilerplate, excellent performance for global state |
| **Expo SDK 54** | Access to native APIs (battery, keep-awake, blur) with managed workflow |
| **In-memory rooms** | No database needed — rooms are ephemeral sessions |
| **Custom design system** | Full control over premium look without external UI library overhead |

---

## Privacy & Security

- 🔒 **No cloud** — Video never leaves your local network
- 🔒 **P2P encrypted** — WebRTC uses DTLS-SRTP encryption by default
- 🔒 **No accounts** — No sign-up, no tracking, no analytics
- 🔒 **Ephemeral rooms** — Auto-deleted after 30 minutes of inactivity
- 🔒 **Open source** — Full code transparency

---

## Roadmap

- [ ] Local video recording to device storage
- [ ] Motion detection with on-device AI
- [ ] Multi-camera dashboard
- [ ] Push notifications via FCM
- [ ] QR code room sharing
- [ ] TURN server for external network access
- [ ] iOS support

---

## Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with ❤️ for the open-source community</sub>
</p>
