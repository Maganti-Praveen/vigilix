const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// All device routes require authentication
router.use(authenticateToken);

/**
 * POST /api/devices/register
 * Register a new device (camera or viewer)
 */
router.post('/register', async (req, res) => {
  try {
    const { deviceName, deviceModel, role, fcmToken } = req.body;

    if (!deviceName || !role) {
      return res.status(400).json({ error: 'deviceName and role are required' });
    }

    if (!['camera', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "camera" or "viewer"' });
    }

    // Create device
    const device = new Device({
      userId: req.userId,
      deviceName: deviceName.trim(),
      deviceModel: deviceModel || 'Unknown',
      role,
      fcmToken: fcmToken || null,
    });

    await device.save();

    // Add device to user's device list
    await User.findByIdAndUpdate(req.userId, {
      $push: { devices: device._id },
    });

    console.log(`[Devices] Registered: ${deviceName} (${role}) for user ${req.userId}`);

    res.status(201).json({
      success: true,
      device: device.toObject(),
    });
  } catch (error) {
    console.error('[Devices] Register error:', error.message);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

/**
 * GET /api/devices
 * List all devices for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.userId })
      .sort({ role: 1, createdAt: -1 });

    res.json({
      success: true,
      devices: devices.map(d => d.toObject()),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list devices' });
  }
});

/**
 * PUT /api/devices/:id/status
 * Update device online status, battery, FCM token
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { isOnline, batteryLevel, isCharging, fcmToken } = req.body;

    const update = { lastSeen: Date.now() };
    if (typeof isOnline === 'boolean') update.isOnline = isOnline;
    if (typeof batteryLevel === 'number') update.lastBatteryLevel = batteryLevel;
    if (typeof isCharging === 'boolean') update.lastBatteryCharging = isCharging;
    if (fcmToken) update.fcmToken = fcmToken;

    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ success: true, device: device.toObject() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update device' });
  }
});

/**
 * DELETE /api/devices/:id
 * Remove a device
 */
router.delete('/:id', async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Remove from user's device list
    await User.findByIdAndUpdate(req.userId, {
      $pull: { devices: device._id },
    });

    console.log(`[Devices] Removed: ${device.deviceName}`);
    res.json({ success: true, message: 'Device removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove device' });
  }
});

/**
 * POST /api/devices/:id/wake
 * Send wake-up push notification to a camera device
 */
router.post('/:id/wake', async (req, res) => {
  try {
    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.userId,
      role: 'camera',
    });

    if (!device) {
      return res.status(404).json({ error: 'Camera device not found' });
    }

    if (!device.fcmToken) {
      return res.status(400).json({ error: 'Camera has no push token registered' });
    }

    // TODO: Send FCM push notification when Firebase is configured
    // For now, just mark the intent
    console.log(`[Devices] Wake request for: ${device.deviceName} (FCM: ${device.fcmToken ? 'yes' : 'no'})`);

    res.json({
      success: true,
      message: 'Wake signal sent',
      roomCode: device.roomCode,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send wake signal' });
  }
});

module.exports = router;
