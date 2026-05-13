const mongoose = require('mongoose');
const { generateRoomCode } = require('../utils/roomCode');

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deviceName: {
    type: String,
    required: true,
    trim: true,
  },
  deviceModel: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['camera', 'viewer'],
    required: true,
  },
  // Persistent room code for camera devices
  roomCode: {
    type: String,
    unique: true,
    sparse: true, // allows null for viewers
  },
  fcmToken: {
    type: String,
    default: null,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  lastBatteryLevel: {
    type: Number,
    default: null,
  },
  lastBatteryCharging: {
    type: Boolean,
    default: null,
  },
}, {
  timestamps: true,
});

// Auto-generate persistent room code for camera devices
deviceSchema.pre('save', function(next) {
  if (this.role === 'camera' && !this.roomCode) {
    this.roomCode = generateRoomCode();
  }
  next();
});

module.exports = mongoose.model('Device', deviceSchema);
