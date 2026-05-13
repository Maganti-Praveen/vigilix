/**
 * Socket.IO Event Handlers
 * Manages all real-time communication events for signaling,
 * room management, and device control
 */

const roomManager = require('../services/roomManager');

/**
 * Initialize socket event handlers
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // ─── Room Events ───────────────────────────────────────────

    /**
     * Camera device creates a new room
     */
    socket.on('create-room', (callback) => {
      try {
        const room = roomManager.createRoom(socket.id);
        socket.join(room.code);
        socket.roomCode = room.code;
        socket.role = 'camera';

        const response = {
          success: true,
          roomCode: room.code,
          message: 'Room created successfully',
        };

        if (typeof callback === 'function') {
          callback(response);
        }

        console.log(`[Socket] Room created: ${room.code}`);
      } catch (error) {
        console.error('[Socket] Error creating room:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    /**
     * Viewer joins an existing room
     */
    socket.on('join-room', ({ roomCode }, callback) => {
      try {
        if (!roomCode) {
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Room code is required' });
          }
          return;
        }

        const room = roomManager.joinRoom(roomCode, socket.id);

        if (!room) {
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Room not found or expired' });
          }
          return;
        }

        socket.join(room.code);
        socket.roomCode = room.code;
        socket.role = 'viewer';

        // Notify camera that a viewer connected
        io.to(room.cameraSocketId).emit('viewer-connected', {
          viewerSocketId: socket.id,
          viewerCount: room.viewers.size,
        });

        const response = {
          success: true,
          roomCode: room.code,
          isStreaming: room.isStreaming,
          cameraSocketId: room.cameraSocketId,
          message: 'Joined room successfully',
        };

        if (typeof callback === 'function') {
          callback(response);
        }

        console.log(`[Socket] Viewer ${socket.id} joined room: ${room.code}`);
      } catch (error) {
        console.error('[Socket] Error joining room:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    /**
     * Leave current room
     */
    socket.on('leave-room', () => {
      handleLeaveRoom(socket, io);
    });

    // ─── Stream Events ─────────────────────────────────────────

    /**
     * Camera starts streaming
     */
    socket.on('start-stream', () => {
      if (socket.roomCode) {
        roomManager.updateStreamStatus(socket.roomCode, true);
        socket.to(socket.roomCode).emit('stream-started');
        console.log(`[Socket] Stream started in room: ${socket.roomCode}`);
      }
    });

    /**
     * Camera stops streaming
     */
    socket.on('stop-stream', () => {
      if (socket.roomCode) {
        roomManager.updateStreamStatus(socket.roomCode, false);
        socket.to(socket.roomCode).emit('stream-stopped');
        console.log(`[Socket] Stream stopped in room: ${socket.roomCode}`);
      }
    });

    // ─── WebRTC Signaling Events ────────────────────────────────

    /**
     * Relay WebRTC offer from camera to viewer
     */
    socket.on('offer', ({ targetSocketId, sdp }) => {
      console.log(`[WebRTC] Offer from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit('offer', {
        sdp,
        senderSocketId: socket.id,
      });
    });

    /**
     * Relay WebRTC answer from viewer to camera
     */
    socket.on('answer', ({ targetSocketId, sdp }) => {
      console.log(`[WebRTC] Answer from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit('answer', {
        sdp,
        senderSocketId: socket.id,
      });
    });

    /**
     * Relay ICE candidates between peers
     */
    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('ice-candidate', {
        candidate,
        senderSocketId: socket.id,
      });
    });

    // ─── Device Control Events ──────────────────────────────────

    /**
     * Toggle flashlight on camera device (sent by viewer)
     */
    socket.on('toggle-flash', ({ roomCode, enabled }) => {
      const room = roomManager.getRoom(roomCode);
      if (room) {
        roomManager.updateRoomProperty(roomCode, 'flashlightOn', enabled);
        io.to(room.cameraSocketId).emit('flash-command', { enabled });
        console.log(`[Socket] Flash ${enabled ? 'ON' : 'OFF'} in room: ${roomCode}`);
      }
    });

    /**
     * Camera switch (front/back) - sent by viewer or camera
     */
    socket.on('switch-camera', ({ roomCode, cameraType }) => {
      const room = roomManager.getRoom(roomCode);
      if (room) {
        roomManager.updateRoomProperty(roomCode, 'cameraType', cameraType);
        io.to(room.cameraSocketId).emit('camera-switch-command', { cameraType });
      }
    });

    /**
     * Recording control
     */
    socket.on('start-recording', ({ roomCode }) => {
      const room = roomManager.getRoom(roomCode);
      if (room) {
        roomManager.updateRoomProperty(roomCode, 'isRecording', true);
        io.to(room.cameraSocketId).emit('recording-command', { action: 'start' });
      }
    });

    socket.on('stop-recording', ({ roomCode }) => {
      const room = roomManager.getRoom(roomCode);
      if (room) {
        roomManager.updateRoomProperty(roomCode, 'isRecording', false);
        io.to(room.cameraSocketId).emit('recording-command', { action: 'stop' });
      }
    });

    // ─── Status Events ──────────────────────────────────────────

    /**
     * Camera sends battery status
     */
    socket.on('battery-status', ({ roomCode, level, isCharging }) => {
      if (roomCode) {
        socket.to(roomCode).emit('battery-status-update', { level, isCharging });
      }
    });

    /**
     * Stream quality update
     */
    socket.on('stream-quality-update', ({ roomCode, quality }) => {
      if (roomCode) {
        socket.to(roomCode).emit('quality-update', { quality });
      }
    });

    /**
     * Mic toggle
     */
    socket.on('toggle-mic', ({ roomCode, enabled }) => {
      if (roomCode) {
        roomManager.updateRoomProperty(roomCode, 'micEnabled', enabled);
        socket.to(roomCode).emit('mic-toggled', { enabled });
      }
    });

    // ─── Reconnection Events ────────────────────────────────────

    /**
     * Client requests reconnection to existing room
     */
    socket.on('reconnect-to-room', ({ roomCode, role }, callback) => {
      const room = roomManager.getRoom(roomCode);

      if (!room) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Room no longer exists' });
        }
        return;
      }

      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.role = role;

      if (role === 'camera') {
        room.cameraSocketId = socket.id;
        socket.to(roomCode).emit('camera-reconnected');
      } else {
        roomManager.joinRoom(roomCode, socket.id);
        io.to(room.cameraSocketId).emit('viewer-connected', {
          viewerSocketId: socket.id,
          viewerCount: room.viewers.size,
        });
      }

      if (typeof callback === 'function') {
        callback({
          success: true,
          roomCode: room.code,
          isStreaming: room.isStreaming,
        });
      }
    });

    // ─── Disconnect Handling ────────────────────────────────────

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
      handleLeaveRoom(socket, io);
    });
  });
}

/**
 * Handle client leaving a room (or disconnecting)
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
function handleLeaveRoom(socket, io) {
  if (!socket.roomCode) return;

  const room = roomManager.getRoom(socket.roomCode);
  if (!room) return;

  if (socket.role === 'camera') {
    // Camera disconnected — notify all viewers
    socket.to(socket.roomCode).emit('camera-offline');
    roomManager.deleteRoom(socket.roomCode);
    console.log(`[Socket] Camera disconnected, room ${socket.roomCode} deleted`);
  } else if (socket.role === 'viewer') {
    // Viewer disconnected — notify camera
    roomManager.leaveRoom(socket.roomCode, socket.id);
    io.to(room.cameraSocketId).emit('viewer-disconnected', {
      viewerSocketId: socket.id,
      viewerCount: room.viewers.size,
    });
  }

  socket.leave(socket.roomCode);
  socket.roomCode = null;
  socket.role = null;
}

module.exports = { initializeSocketHandlers };
