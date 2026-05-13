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
const apiRoutes = require('./routes/api');
const { initializeSocketHandlers } = require('./socket/handlers');

// ─── Configuration ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || null;
const SELF_URL = RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// ─── Express Setup ──────────────────────────────────────────────
const path = require('path');
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);

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
