const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getRoomStats } = require('../services/roomManager');

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const mongoState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    mongodb: mongoState[mongoose.connection.readyState] || 'unknown',
  });
});

/**
 * Server stats endpoint
 */
router.get('/stats', (req, res) => {
  const stats = getRoomStats();
  res.json({
    status: 'ok',
    ...stats,
    uptime: process.uptime(),
  });
});

/**
 * App version check endpoint — for in-app updates
 * Mobile app calls this on launch to check if a new version is available.
 */
router.get('/version', (req, res) => {
  res.json({
    currentVersion: '1.2.0',
    versionCode: 3,
    minSupportedVersion: '1.0.0',
    releaseDate: '2026-09-24',
    downloadUrl: 'https://github.com/Maganti-Praveen/vigilix/releases/latest/download/Vigilix.apk',
    changelog: [
      'Two-way talk-back audio with loudspeaker routing and Web Audio dynamic compression',
      'Smooth front and back camera switching live during WebRTC streaming',
      'Direct Camera2 hardware torch integration',
      'High-priority FCM remote push wake-up',
      'Modern glassmorphic Command Center web viewer dashboard',
    ],
    updateRequired: false,
    updateAvailable: false,
  });
});

module.exports = router;
