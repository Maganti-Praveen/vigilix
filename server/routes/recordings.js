const express = require('express');
const router = express.Router();
const Recording = require('../models/Recording');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

/**
 * POST /api/recordings
 * Camera reports a new recording saved to local storage
 */
router.post('/', async (req, res) => {
  try {
    const { cameraDeviceId, filename, filePath, fileSize, duration } = req.body;

    if (!cameraDeviceId || !filename || !filePath) {
      return res.status(400).json({ error: 'cameraDeviceId, filename, and filePath are required' });
    }

    const recording = new Recording({
      cameraDeviceId,
      userId: req.userId,
      filename,
      filePath,
      fileSize: fileSize || 0,
      duration: duration || 0,
    });

    await recording.save();

    console.log(`[Recordings] Saved: ${filename} (${Math.round(fileSize / 1024 / 1024)}MB)`);

    res.status(201).json({
      success: true,
      recording: recording.toObject(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save recording' });
  }
});

/**
 * GET /api/recordings
 * List all recordings for the user, grouped by camera
 */
router.get('/', async (req, res) => {
  try {
    const { cameraDeviceId, limit = 50, skip = 0 } = req.query;

    const filter = { userId: req.userId };
    if (cameraDeviceId) filter.cameraDeviceId = cameraDeviceId;

    const recordings = await Recording.find(filter)
      .populate('cameraDeviceId', 'deviceName')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Recording.countDocuments(filter);

    res.json({
      success: true,
      recordings: recordings.map(r => r.toObject()),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list recordings' });
  }
});

/**
 * DELETE /api/recordings/:id
 * Delete a recording (metadata only — camera app deletes the file)
 */
router.delete('/:id', async (req, res) => {
  try {
    const recording = await Recording.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    res.json({
      success: true,
      message: 'Recording deleted',
      filePath: recording.filePath, // so camera app can delete the file
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

module.exports = router;
