/**
 * Vigilix Signaling Server
 *
 * Lightweight Node.js + Express + Socket.IO server
 * Handles:
 *   - Room creation and management
 *   - WebRTC signaling (SDP offer/answer, ICE candidates)
 *   - Device control commands (flashlight, recording, etc.)
 *   - Client presence and status
 *
 * Does NOT handle video/audio streaming — that's peer-to-peer via WebRTC
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const recordingRoutes = require('./routes/recordings');
const { initializeSocketHandlers } = require('./socket/handlers');
const { authenticateSocket } = require('./middleware/auth');

// ─── Configuration ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || null;
const SELF_URL = RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
const MONGODB_URI = process.env.MONGODB_URI || null;

// ─── MongoDB Connection ─────────────────────────────────────────
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('[MongoDB] ✅ Connected to database');
      // Drop stale unique index on roomCode (was causing registration failures)
      try {
        await mongoose.connection.collection('devices').dropIndex('roomCode_1');
        console.log('[MongoDB] Dropped stale roomCode index');
      } catch (e) {
        // Index doesn't exist — that's fine
      }
    })
    .catch(err => console.error('[MongoDB] ❌ Connection failed:', err.message));
} else {
  console.log('[MongoDB] ⚠️ No MONGODB_URI set — running in signaling-only mode (v1.0 compatible)');
}

// ─── Express Setup ──────────────────────────────────────────────
const path = require('path');
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/recordings', recordingRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Vigilix Signaling Server',
    version: '1.0.0',
    status: 'running',
    uptime: Math.floor(process.uptime()),
  });
});

// ─── Server URL endpoint (mobile app uses this to verify) ───────
app.get('/api/server-url', (req, res) => {
  res.json({ url: SELF_URL });
});

// ─── HTTP + Socket.IO Server ────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  // Connection reliability settings
  pingTimeout: 30000,
  pingInterval: 10000,
  transports: ['websocket', 'polling'],
});

// Socket authentication middleware (backward compatible)
io.use(authenticateSocket);

// Initialize socket event handlers
initializeSocketHandlers(io);

// ─── Start Server ───────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Vigilix Signaling Server                 ║');
  console.log(`║   Running on port ${PORT}                    ║`);
  console.log(`║   URL: ${SELF_URL.padEnd(35)}║`);
  console.log('║   WebSocket: ready                         ║');
  console.log('║   REST API:  ready                         ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');

  // ─── Self-Ping Keep-Alive (prevents Render free tier sleep) ──
  if (RENDER_EXTERNAL_URL) {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
    setInterval(() => {
      http.get(`${RENDER_EXTERNAL_URL}/api/health`, (res) => {
        console.log(`[Keep-Alive] Ping OK — status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.log(`[Keep-Alive] Ping failed: ${err.message}`);
      });
    }, PING_INTERVAL);
    console.log('[Keep-Alive] Self-ping enabled (every 14 min)');
  }
});

// ─── Graceful Shutdown ──────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down...');
  io.close();
  server.close(() => {
    console.log('[Server] Shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down...');
  io.close();
  server.close(() => {
    console.log('[Server] Shut down complete');
    process.exit(0);
  });
});
