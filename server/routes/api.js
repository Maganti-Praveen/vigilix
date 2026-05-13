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

module.exports = router;
