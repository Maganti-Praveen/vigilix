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
    currentVersion: '1.1.0',
    versionCode: 2,
    minSupportedVersion: '1.0.0',
    releaseDate: '2026-05-14',
    downloadUrl: 'https://github.com/Maganti-Praveen/vigilix/releases/latest/download/Vigilix.apk',
    changelog: [
      'Account login & registration',
      'Device pairing with saved cameras',
      'Push-to-wake offline cameras (FCM)',
      'Native background foreground service',
      'Remote recording from viewer',
      'Recordings gallery',
      'Improved audio quality (Opus 64kbps)',
      'Auto-reconnect with ICE restart',
    ],
    updateRequired: false,
    updateAvailable: true,
  });
});

module.exports = router;
