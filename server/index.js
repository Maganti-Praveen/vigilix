/**
 * Smart CCTV Signaling Server
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
    name: 'Smart CCTV Signaling Server',
    version: '1.0.0',
    status: 'running',
  });
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
  console.log('║   Smart CCTV Signaling Server              ║');
  console.log(`║   Running on port ${PORT}                    ║`);
  console.log('║   WebSocket: ready                         ║');
  console.log('║   REST API:  ready                         ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
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
