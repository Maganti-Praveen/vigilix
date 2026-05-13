const express = require('express');
const router = express.Router();
const { getRoomStats } = require('../services/roomManager');

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
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
