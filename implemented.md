# Vigilix (Smart CCTV) — Full Implementation Document

Everything that has been built in this project, how it works, and how each piece connects.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Server Implementation](#3-server-implementation)
4. [Mobile App — Core Services](#4-mobile-app--core-services)
5. [Mobile App — State Management](#5-mobile-app--state-management)
6. [Mobile App — Hooks](#6-mobile-app--hooks)
7. [Phase 1–7: Core Streaming](#7-phase-17-core-streaming)
8. [Phase 8: Flashlight Control](#8-phase-8-flashlight-control)
9. [Phase 9: Reconnection & Optimization](#9-phase-9-reconnection--optimization)
10. [Phase 10: Testing & Polish](#10-phase-10-testing--polish)
11. [Vigilix UI/UX Redesign](#11-vigilix-uiux-redesign)
12. [Web Viewer](#12-web-viewer)
13. [File Inventory](#13-file-inventory)
14. [How to Run](#14-how-to-run)

---

## 1. Project Overview

**Vigilix** (formerly Smart CCTV) is a mobile surveillance platform that transforms Android phones into security cameras with real-time P2P streaming.

**Key properties:**
- Peer-to-peer video/audio via WebRTC (no video through server)
- Bidirectional audio (talk-back from viewer to camera)
- Remote hardware control (flashlight)
- Works on LAN — no cloud dependency
- Web viewer for browser-based monitoring
- Full dark + light theme support

---

## 2. Architecture

```
┌──────────────┐          WebRTC P2P          ┌──────────────────┐
│  Camera Phone │◄══════════════════════════►│ Viewer Phone/Web │
│  (streams A/V) │     (video + bidir audio)   │  (watches stream) │
└──────┬───────┘                              └────────┬─────────┘
       │ Socket.IO                                     │ Socket.IO
       │                                               │
       └──────────────►┌────────────────┐◄─────────────┘
                       │ Signaling Server │
                       │   (port 3001)    │
                       │  Node + Express  │
                       │  + Socket.IO     │
                       └────────────────┘
```

**Data flow:**
1. Camera connects via Socket.IO → creates room → gets 6-char code
2. Viewer enters code → joins room via Socket.IO
3. Server brokers WebRTC handshake (SDP offer/answer + ICE candidates)
4. Direct P2P connection established — server exits the media path
5. All control commands (flash, battery) relay through Socket.IO

---

## 3. Server Implementation

### 3.1 Entry Point — `server/index.js`
- Express + HTTP server on port 3001
- Socket.IO with CORS, polling→websocket upgrade
- Serves static `public/` directory (web viewer)
- REST API at `/api` for health checks and room stats

### 3.2 Room Manager — `server/services/roomManager.js`
- **In-memory Map** stores all active rooms
- `createRoom(socketId)` → generates unique 6-char alphanumeric code
- `joinRoom(code, viewerSocketId)` → adds viewer to room's viewer Map
- `leaveRoom(code, viewerSocketId)` → removes viewer
- `getRoomBySocket(id)` → finds room by any participant socket
- Auto-cleanup: rooms expire after 30 minutes of inactivity via `setTimeout` rescheduling
- Tracks: `isStreaming`, `flashlightOn`, `cameraType`, `micEnabled`, `isRecording`

### 3.3 Room Code Generator — `server/utils/roomCode.js`
- Generates 6-character uppercase alphanumeric codes
- Excludes confusing characters (O, 0, I, 1, L)
- Retries if collision with existing room

### 3.4 Socket Handlers — `server/socket/handlers.js` (318 lines)

All 15+ socket events handled:

| Event | Handler Logic |
|-------|--------------|
| `create-room` | Creates room, joins socket to room channel, responds with code |
| `join-room` | Validates code, adds viewer, notifies camera of new viewer |
| `leave-room` | Removes from room, notifies remaining participants |
| `start-stream` | Updates `isStreaming=true`, broadcasts to room |
| `stop-stream` | Updates `isStreaming=false`, broadcasts to room |
| `offer` | Relays SDP offer from camera → specific viewer socket |
| `answer` | Relays SDP answer from viewer → camera socket |
| `ice-candidate` | Relays ICE candidate to target socket |
| `toggle-flash` | Forwards flash command to camera socket |
| `battery-status` | Relays battery level/charging from camera → all viewers |
| `reconnect-to-room` | Re-adds socket to room after disconnect (camera or viewer) |
| `disconnect` | Cleans up: removes from room, notifies peers, deletes empty rooms |

### 3.5 REST API — `server/routes/api.js`
- `GET /api/health` → server status
- `GET /api/rooms` → active room count and stats

---

## 4. Mobile App — Core Services

### 4.1 Socket Service — `mobile/src/services/socketService.ts` (172 lines)

Singleton pattern managing the Socket.IO client connection.

**How it works:**
- `connect()` creates socket with `polling→websocket` upgrade strategy
- **Listener buffering**: if `on()` is called before `connect()`, listeners are queued in `pendingListeners[]` and applied when socket initializes
- `emit()` handles 4 argument patterns: data+callback, callback-only, data-only, no-args
- `off()` removes from both live socket and pending buffer
- Reconnection config: 15 attempts, 1–5s backoff, 15s timeout

### 4.2 WebRTC Service — `mobile/src/services/webrtcService.ts` (460 lines)

Singleton managing peer connections and media streams.

**Methods implemented:**
- `getLocalStream(facing, quality)` → captures camera+mic via `mediaDevices.getUserMedia`
- `getAudioOnlyStream()` → mic-only stream for viewer talk-back
- `createPeerConnection()` → creates `RTCPeerConnection` with STUN servers, sets up `ontrack`/`onicecandidate`/`onconnectionstatechange` handlers, adds local tracks
- `createOffer()` / `createAnswer()` → SDP negotiation with `setLocalDescription`
- `setRemoteDescription(sdp)` → applies remote SDP + flushes pending ICE candidates
- `addICECandidate(candidate)` → buffers if remote description not yet set
- `setTorch(enabled)` → calls `_setTorch()` JNI bridge on video track for hardware flashlight
- `isTorchSupported()` → checks if `_setTorch` method exists on current video track
- `setMaxBitrate(bps)` → modifies `RTCRtpSender` encoding parameters for adaptive quality
- `getStats()` → parses `RTCPeerConnection.getStats()` into structured `{bitrate, packetLoss, roundTripTime, fps, resolution}`
- `switchCamera()` → calls internal `_switchCamera()` on video track
- `toggleAudio(enabled)` / `toggleVideo(enabled)` → enables/disables tracks
- `cleanup()` → closes peer connection, stops all tracks, nullifies references

---

## 5. Mobile App — State Management

### Zustand Store — `mobile/src/store/appStore.ts` (116 lines)

Single global store with all app state:

```
mode, roomCode, connectionStatus, isStreaming,
isFrontCamera, isFlashOn, isMicEnabled, isRecording,
viewerCount, isMuted, isTalkingBack, isFullscreen,
streamQuality, batteryInfo, videoQuality, autoReconnect, error
```

Each field has a setter. `resetState()` returns everything to initial values.

---

## 6. Mobile App — Hooks

### 6.1 useSocket — `mobile/src/hooks/useSocket.ts` (253 lines)

Exposes: `connect`, `createRoom`, `joinRoom`, `startStream`, `stopStream`, `leaveRoom`, `disconnect`, `toggleFlash`, `sendBatteryStatus`, `setOnFlashCommand`

**Key behaviors:**
- `connect()` → calls `socketService.connect()`, registers `connect`/`disconnect`/`connect_error` handlers, updates Zustand `connectionStatus`
- **Auto-rejoin**: on socket reconnect, emits `reconnect-to-room` with active room code
- `createRoom()` → emits `create-room`, returns promise with room code
- `joinRoom(code)` → emits `join-room`, returns success/error
- Registers listeners for: `viewer-connected`, `viewer-disconnected`, `stream-started`, `stream-stopped`, `flash-command`, `battery-status-update`
- `setOnFlashCommand(callback)` → registers remote flash handler used by CameraScreen

### 6.2 useWebRTC — `mobile/src/hooks/useWebRTC.ts` (311 lines)

Exposes: `localStream`, `remoteStream`, `peerConnected`, `initLocalStream`, `startAsCamera`, `startAsViewer`, `toggleAudio`, `toggleVideo`, `switchCamera`, `setTorch`, `isTorchSupported`, `setMaxBitrate`, `getStats`, `cleanup`

**How the WebRTC flow works:**

**Camera side:**
1. `initLocalStream()` → gets camera+mic stream
2. Socket receives `viewer-connected` → calls `startAsCamera(viewerSocketId)`
3. `startAsCamera` → creates peer connection, creates SDP offer, emits to viewer
4. Receives `answer` → sets remote description
5. ICE candidates exchanged bidirectionally

**Viewer side:**
1. Socket receives `offer` → calls `startAsViewer(sdp, cameraSocketId)`
2. `startAsViewer` → creates peer connection, acquires mic for talk-back, sets remote description, creates answer, emits to camera
3. `ontrack` event fires → sets `remoteStream` → video renders

### 6.3 usePermissions — `mobile/src/hooks/usePermissions.ts`
- Requests camera + microphone permissions on mount
- Returns `{ hasPermissions, requestPermissions }`

---

## 7. Phase 1–7: Core Streaming

These phases built the working foundation:

| Phase | What Was Built |
|-------|---------------|
| 1 | Project scaffolding: Expo + TypeScript + server |
| 2 | Socket.IO signaling: room create/join/leave |
| 3 | WebRTC service: peer connections, SDP exchange |
| 4 | Camera preview: `getUserMedia` + `RTCView` rendering |
| 5 | Room code display, copy-to-clipboard, viewer count |
| 6 | Viewer stream: join room → receive offer → display video |
| 7 | Bidirectional audio: viewer mic → talk-back to camera |

**Bidirectional audio implementation:**
- Viewer acquires mic-only stream via `getAudioOnlyStream()`
- Audio tracks added to the existing `RTCPeerConnection`
- Camera screen shows "🎙️ TALK-BACK" badge when viewer audio tracks are enabled
- Viewer has separate Mute (incoming) and Talk (outgoing) controls

---

## 8. Phase 8: Flashlight Control

### Remote Flash Toggle
1. Viewer emits `toggle-flash` with `{ roomCode, enabled }`
2. Server handler finds camera socket → emits `flash-command` to camera
3. Camera's `useSocket` calls registered `onFlashCommand` callback
4. Callback calls `webrtcService.setTorch(enabled)` which uses internal `_setTorch()` JNI method on the video track

### Device Capability Detection
- `webrtcService.isTorchSupported()` checks if `_setTorch` function exists on the current video track
- Returns `false` for front camera (no torch hardware)
- CameraScreen disables flash button and shows "N/A" when unsupported
- Torch availability re-checked after camera switch

---

## 9. Phase 9: Reconnection & Optimization

### Auto-Reconnect (Mobile)
- **Socket level**: `socketService` config has `reconnection: true`, 15 attempts, 1–5s backoff
- **App level (CameraScreen)**: monitors `connectionStatus` — if `disconnected` while streaming, schedules reconnect with exponential backoff (2s→10s max)
- **Room rejoin**: `useSocket` emits `reconnect-to-room` with `{ roomCode, role }` on socket reconnect
- **Server handler**: `reconnect-to-room` re-joins socket to room channel, updates camera/viewer socket ID

### Auto-Reconnect (Web Viewer)
- `socket.io.on('reconnect')` → auto-emits `reconnect-to-room` with stored room code

### App State Handling
- `AppState.addEventListener('change')` in both CameraScreen and ViewerScreen
- When app returns to foreground after backgrounding → reconnects if socket was lost

### Adaptive Bitrate
- CameraScreen runs a 5-second stats polling interval via `getStats()`
- Calculates bitrate from `bytesSent` delta
- Quality mapping: >600kbps=excellent, >300kbps=good, >100kbps=weak, else=reconnecting
- After 3 consecutive poor readings → `setMaxBitrate(300000)` reduces to 300kbps
- Updates `streamQuality` in Zustand → shown in UI quality badge

### Battery Optimization
- `expo-battery` polls level every 30 seconds while streaming
- Sends `battery-status` to server → relayed to viewers
- If battery <15% and not charging → `setMaxBitrate(200000)` reduces to 200kbps
- Viewer shows battery badge with low-battery warning styling at <20%

### Keep-Awake
- `expo-keep-awake` activated during streaming (camera) and viewing
- `activateKeepAwakeAsync('camera')` / `deactivateKeepAwake('camera')`
- Properly cleaned up on unmount

---

## 10. Phase 10: Testing & Polish

### Error Handling
- Dismissible error banner in CameraScreen and ViewerScreen
- `setError(null)` clears errors on new actions
- Try/catch wrapping on all async operations (stream init, room create, join)
- Graceful fallbacks for unavailable features (battery, torch)

### Performance
- `StatusItem` wrapped in `React.memo()` to prevent unnecessary re-renders
- All intervals (stats, battery, recording timer) properly cleared on unmount
- `useCallback` on all handlers to prevent child re-renders
- Memoized theme context with `useMemo`

### UI Indicators
- Loading spinners during camera initialization and room joining
- "Connecting to server…" notice when socket is disconnected
- Reconnecting badge with spinner in header
- Offline state disables Join/Start buttons

---

## 11. Vigilix UI/UX Redesign

Complete visual overhaul from developer-style to premium consumer app.

### Brand
- **Name**: Smart CCTV → **Vigilix**
- **Package**: `com.vigilix.app`
- **Logo**: Geometric abstract "V" in soft blue gradient
- **Tagline**: Smart Mobile Surveillance

### Design System — `mobile/src/design/`

| File | What It Contains |
|------|-----------------|
| `tokens.ts` | Color palette (soft blue + teal), Inter typography scale, spacing (2–80px), border radii, shadow presets, glass configs, animation durations, icon sizes |
| `themes.ts` | Light + Dark theme objects with semantic mapping: `bg`, `text`, `accent`, `border`, `status`, `surface`, `nav`, `gradient` |
| `ThemeContext.tsx` | React context with `useTheme()` hook, light/dark/system mode, `toggleTheme()` |
| `animations.ts` | 6 hooks: `useFadeIn`, `useSlideUp`, `useScalePress`, `usePulse`, `useStaggeredEntrance`, `useScaleEntry` |

### Component Library — `mobile/src/components/ui/`

| Component | Purpose | Key Feature |
|-----------|---------|-------------|
| `VButton` | Action button | Gradient primary, scale-press animation, loading state |
| `VCard` | Surface card | Default/elevated/outlined, theme-aware shadows |
| `VIconButton` | Circular control | Glass mode for camera overlays, active/danger states |
| `VBadge` | Status indicator | LIVE/REC with animated pulse dot |
| `VInput` | Text input | Focus ring border, label, error state |
| `VGlass` | Frosted panel | `expo-blur` for floating overlays |

### Navigation — `mobile/src/components/navigation/`

`BottomTabBar` — 4 tabs (Home, Camera, Viewer, Settings) with active indicator pill. **Hidden on Camera and Viewer screens** for immersive fullscreen experience.

### Screens Redesigned

**SplashScreen**: Dark gradient background → ambient blue glow → logo scale-in with spring → "Vigilix" text fade → tagline fade → hold → smooth fade-out transition.

**HomeScreen**: Smart-home dashboard. Header with logo + "All Clear" badge. Two gradient mode cards (Camera = blue, Viewer = teal) with arrow indicators. Quick actions grid (4 items). System status card. Staggered entrance animation (5 items, 100ms offset).

**CameraScreen**: Fullscreen immersive. `RTCView` fills entire screen. Top overlay: LIVE badge (pulsing), REC timer, viewer count, quality badge. Center: room code in glass panel (tap to copy). Bottom: floating glass dock with 5 controls (flash, mic, record, flip, stop). No navigation bars visible.

**ViewerScreen**: Two states. Join form: centered layout, large code input, animated slide-up entrance. Stream view: fullscreen `RTCView`, top badges (LIVE, quality, battery), bottom glass control dock (mute, talk, flash, snap, leave).

**SettingsScreen**: Grouped cards. Theme toggle switch. Video quality settings. Connection preferences. About section with logo and version. Hairline dividers. Clean consumer-first UX.

### App.tsx
- Loads Inter font family via `@expo-google-fonts/inter`
- Wraps app in `ThemeProvider` + `SafeAreaProvider`
- Tab bar hidden on camera/viewer for immersive experience
- Status bar adapts to theme (light-content / dark-content)

### Dependencies Added for Redesign
- `expo-linear-gradient` — gradient backgrounds and buttons
- `expo-blur` — frosted glass panels
- `@expo-google-fonts/inter` — Inter 400/500/600/700

---

## 12. Web Viewer

### `server/public/viewer.html` (605 lines)

Standalone browser-based viewer at `http://IP:3001/viewer.html`.

**Features:**
- Glassmorphism dark theme with gradient header
- Room code input with auto-uppercase and Enter key support
- WebRTC stream via native `<video>` element
- **Talk-back**: acquires mic, adds audio track to peer connection, muted by default
- **Flash toggle**: emits `toggle-flash` to server
- **Screenshot**: captures `<canvas>` from video → downloads as PNG
- **Fullscreen**: `requestFullscreen()` API
- **Battery display**: receives `battery-status-update`, shows percentage with low-battery warning
- **Auto-reconnect**: `socket.io.on('reconnect')` → re-emits `reconnect-to-room`
- **Camera offline/reconnected** handlers with overlay messages
- Connection log panel with timestamped entries

---

## 13. File Inventory

### Server (5 files)
```
server/
├── index.js              # Express + Socket.IO server (89 lines)
├── socket/handlers.js    # All socket event handlers (318 lines)
├── services/roomManager.js # Room CRUD + cleanup (213 lines)
├── routes/api.js          # REST endpoints
├── utils/roomCode.js      # Code generator (42 lines)
└── public/viewer.html     # Web viewer (605 lines)
```

### Mobile App (30+ files)
```
mobile/
├── App.tsx                           # Root with font loading + theme (125 lines)
├── app.json                          # Expo config (Vigilix branding)
├── src/
│   ├── design/                       # Design system
│   │   ├── tokens.ts                 # Colors, typography, spacing (210 lines)
│   │   ├── themes.ts                 # Light + Dark themes (200 lines)
│   │   ├── ThemeContext.tsx           # Provider + useTheme (68 lines)
│   │   ├── animations.ts            # 6 animation hooks (170 lines)
│   │   └── index.ts
│   ├── components/
│   │   ├── ui/                       # Reusable components
│   │   │   ├── VButton.tsx           # Gradient button (140 lines)
│   │   │   ├── VCard.tsx             # Surface card (65 lines)
│   │   │   ├── VIconButton.tsx       # Circular control (105 lines)
│   │   │   ├── VBadge.tsx           # Status badge (80 lines)
│   │   │   ├── VInput.tsx           # Text input (70 lines)
│   │   │   ├── VGlass.tsx           # Frosted panel (50 lines)
│   │   │   └── index.ts
│   │   ├── navigation/
│   │   │   └── BottomTabBar.tsx      # 4-tab nav (95 lines)
│   │   └── (legacy components still present)
│   ├── screens/
│   │   ├── SplashScreen.tsx          # Animated splash (147 lines)
│   │   ├── HomeScreen.tsx            # Dashboard (345 lines)
│   │   ├── CameraScreen.tsx          # Fullscreen camera (477 lines)
│   │   ├── ViewerScreen.tsx          # Stream viewer (397 lines)
│   │   ├── SettingsScreen.tsx        # Settings (235 lines)
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useSocket.ts              # Socket.IO lifecycle (253 lines)
│   │   ├── useWebRTC.ts              # WebRTC lifecycle (311 lines)
│   │   └── usePermissions.ts         # Camera/mic permissions
│   ├── services/
│   │   ├── socketService.ts          # Socket singleton (172 lines)
│   │   └── webrtcService.ts          # WebRTC singleton (460 lines)
│   ├── store/
│   │   └── appStore.ts               # Zustand global state (116 lines)
│   ├── constants/
│   │   ├── index.ts                  # Socket events, STUN config, server URL
│   │   └── theme.ts                  # (legacy theme, kept for compatibility)
│   └── types/
│       └── index.ts                  # TypeScript interfaces
```

### Shared
```
shared/
└── constants.js          # Socket event names (JS mirror)
```

**Total**: ~7,000 lines of code across ~35 source files.

---

## 14. How to Run

### Prerequisites
- Node.js 18+
- Android Studio with SDK 36
- Physical Android phone with USB debugging
- Computer and phone on same WiFi

### Step 1: Configure IP
Find your computer's IP:
```bash
hostname -I | awk '{print $1}'
```

Update in two places:
- `mobile/src/constants/index.ts` → `SERVER_URL`
- `server/public/viewer.html` → `SERVER_URL`

### Step 2: Start Server
```bash
cd server && npm install && npm run dev
```

### Step 3: Build & Run Mobile (first time)
```bash
cd mobile && npm install && npx expo run:android
```
> First build takes 15–30 min. Subsequent runs: `npx expo start --dev-client`

### Step 4: Watch from Browser
Open `http://YOUR_IP:3001/viewer.html`

### Usage Flow
1. Open app → Splash → Home
2. Tap "Camera" → "Start Streaming" → room code appears
3. On another device/browser: enter room code → stream connects
4. Use floating controls for flash, mic, recording, talk-back
