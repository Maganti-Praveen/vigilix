/**
 * Room Manager Service
 * Handles in-memory room storage and lifecycle management
 */

const { generateUniqueRoomCode } = require('../utils/roomCode');

// In-memory room storage
const rooms = new Map();

// Room expiry timeout (30 minutes of inactivity)
const ROOM_EXPIRY_MS = 30 * 60 * 1000;

/**
 * Create a new room
 * @param {string} cameraSocketId - Socket ID of the camera device
 * @returns {object} Room data with code and details
 */
function createRoom(cameraSocketId) {
  const roomCode = generateUniqueRoomCode(rooms);

  const room = {
    code: roomCode,
    cameraSocketId,
    viewers: new Map(), // socketId -> viewer info
    createdAt: Date.now(),
    lastActivity: Date.now(),
    isStreaming: false,
    flashlightOn: false,
    cameraType: 'back', // 'front' or 'back'
    isRecording: false,
    micEnabled: true,
  };

  rooms.set(roomCode, room);
  scheduleRoomCleanup(roomCode);

  console.log(`[RoomManager] Room created: ${roomCode} by ${cameraSocketId}`);
  return room;
}

/**
 * Join an existing room as a viewer
 * @param {string} roomCode - The room code to join
 * @param {string} viewerSocketId - Socket ID of the viewer
 * @returns {object|null} Room data or null if not found
 */
function joinRoom(roomCode, viewerSocketId) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = rooms.get(normalizedCode);

  if (!room) {
    return null;
  }

  room.viewers.set(viewerSocketId, {
    socketId: viewerSocketId,
    joinedAt: Date.now(),
  });

  room.lastActivity = Date.now();

  console.log(`[RoomManager] Viewer ${viewerSocketId} joined room: ${normalizedCode}`);
  return room;
}

function normalizeCode(code) {
  return typeof code === 'string' ? code.toUpperCase().trim() : '';
}

/**
 * Remove a viewer from a room
 * @param {string} roomCode - The room code
 * @param {string} viewerSocketId - Socket ID of the viewer to remove
 */
function leaveRoom(roomCode, viewerSocketId) {
  const room = rooms.get(normalizeCode(roomCode));
  if (!room) return;

  room.viewers.delete(viewerSocketId);
  room.lastActivity = Date.now();

  console.log(`[RoomManager] Viewer ${viewerSocketId} left room: ${roomCode}`);
}

/**
 * Get room by code
 * @param {string} roomCode - The room code
 * @returns {object|null} Room data or null
 */
function getRoom(roomCode) {
  return rooms.get(normalizeCode(roomCode)) || null;
}

/**
 * Get room by camera socket ID
 * @param {string} cameraSocketId - Socket ID of the camera
 * @returns {object|null} Room data or null
 */
function getRoomByCamera(cameraSocketId) {
  for (const [, room] of rooms) {
    if (room.cameraSocketId === cameraSocketId) {
      return room;
    }
  }
  return null;
}

/**
 * Get room by any socket ID (camera or viewer)
 * @param {string} socketId - Socket ID to search for
 * @returns {object|null} Room data or null
 */
function getRoomBySocket(socketId) {
  for (const [, room] of rooms) {
    if (room.cameraSocketId === socketId || room.viewers.has(socketId)) {
      return room;
    }
  }
  return null;
}

/**
 * Delete a room
 * @param {string} roomCode - The room code to delete
 */
function deleteRoom(roomCode) {
  const code = normalizeCode(roomCode);
  const room = rooms.get(code);
  if (room && room.cameraGraceTimer) {
    clearTimeout(room.cameraGraceTimer);
  }
  rooms.delete(code);
  console.log(`[RoomManager] Room deleted: ${code}`);
}

/**
 * Update room streaming status
 * @param {string} roomCode - The room code
 * @param {boolean} isStreaming - Whether the camera is streaming
 */
function updateStreamStatus(roomCode, isStreaming) {
  const room = rooms.get(normalizeCode(roomCode));
  if (room) {
    room.isStreaming = isStreaming;
    room.lastActivity = Date.now();
  }
}

/**
 * Update room property
 * @param {string} roomCode - The room code
 * @param {string} key - Property key
 * @param {*} value - Property value
 */
function updateRoomProperty(roomCode, key, value) {
  const room = rooms.get(normalizeCode(roomCode));
  if (room) {
    room[key] = value;
    room.lastActivity = Date.now();
  }
}

/**
 * Set camera as offline and start a grace period before deleting room
 * @param {string} roomCode - The room code
 * @param {Function} [onExpired] - Callback if grace period expires
 * @param {number} [graceMs=90000] - Grace period in ms (default 90s)
 */
function setCameraOffline(roomCode, onExpired, graceMs = 90000) {
  const room = rooms.get(normalizeCode(roomCode));
  if (!room) return;

  room.cameraSocketId = null;
  room.lastActivity = Date.now();

  if (room.cameraGraceTimer) {
    clearTimeout(room.cameraGraceTimer);
  }

  room.cameraGraceTimer = setTimeout(() => {
    console.log(`[RoomManager] Camera grace period expired for room: ${room.code}`);
    deleteRoom(room.code);
    if (typeof onExpired === 'function') {
      onExpired();
    }
  }, graceMs);
}

/**
 * Cancel camera offline grace period when camera reconnects
 * @param {string} roomCode - The room code
 */
function cancelCameraGracePeriod(roomCode) {
  const room = rooms.get(normalizeCode(roomCode));
  if (room && room.cameraGraceTimer) {
    clearTimeout(room.cameraGraceTimer);
    room.cameraGraceTimer = null;
    room.lastActivity = Date.now();
    console.log(`[RoomManager] Camera grace period cancelled for room: ${room.code}`);
  }
}

/**
 * Schedule automatic room cleanup after inactivity
 * @param {string} roomCode - The room code
 */
function scheduleRoomCleanup(roomCode) {
  const code = normalizeCode(roomCode);
  setTimeout(() => {
    const room = rooms.get(code);
    if (room && Date.now() - room.lastActivity >= ROOM_EXPIRY_MS) {
      deleteRoom(code);
      console.log(`[RoomManager] Room ${code} expired and cleaned up`);
    } else if (room) {
      // Reschedule if still active
      scheduleRoomCleanup(code);
    }
  }, ROOM_EXPIRY_MS);
}

/**
 * Get all active rooms count (for monitoring)
 * @returns {number} Number of active rooms
 */
function getActiveRoomsCount() {
  return rooms.size;
}

/**
 * Get room stats
 * @returns {object} Room statistics
 */
function getRoomStats() {
  let totalViewers = 0;
  let streamingRooms = 0;

  for (const [, room] of rooms) {
    totalViewers += room.viewers.size;
    if (room.isStreaming) streamingRooms++;
  }

  return {
    totalRooms: rooms.size,
    streamingRooms,
    totalViewers,
  };
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomByCamera,
  getRoomBySocket,
  deleteRoom,
  updateStreamStatus,
  updateRoomProperty,
  setCameraOffline,
  cancelCameraGracePeriod,
  getActiveRoomsCount,
  getRoomStats,
};
