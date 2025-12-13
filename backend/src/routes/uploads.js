const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const { authenticate, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');

const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and audio
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and audio files are allowed'));
    }
  }
});

// Upload photo for report
router.post('/photos/:reportId', [
  authenticate,
  requirePermission('reports', 'write'),
  enforceFleetContext,
  upload.single('photo')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { reportId } = req.params;
    const fleet_id = req.user.fleet_id;
    
    // Verify report exists and belongs to fleet
    const [reports] = await sequelize.query(`
      SELECT id FROM accident_reports 
      WHERE id = :report_id AND fleet_id = :fleet_id
    `, {
      replacements: { report_id: reportId, fleet_id },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Generate unique file key
    const fileKey = `fleet-${fleet_id}/reports/${reportId}/photos/${uuidv4()}-${req.file.originalname}`;
    
    // Upload to S3
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'private'
    };
    
    const s3Result = await s3.upload(uploadParams).promise();
    
    // Get current max order_index
    const [maxOrder] = await sequelize.query(`
      SELECT COALESCE(MAX(order_index), 0) as max_order 
      FROM report_photos 
      WHERE report_id = :report_id
    `, {
      replacements: { report_id: reportId },
      type: sequelize.QueryTypes.SELECT
    });
    
    // Save photo record
    const [result] = await sequelize.query(`
      INSERT INTO report_photos 
        (report_id, fleet_id, file_key, file_url, file_size, mime_type, order_index)
      VALUES 
        (:report_id, :fleet_id, :file_key, :file_url, :file_size, :mime_type, :order_index)
      RETURNING *
    `, {
      replacements: {
        report_id: reportId,
        fleet_id,
        file_key: fileKey,
        file_url: s3Result.Location,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        order_index: (maxOrder[0]?.max_order || 0) + 1
      },
      type: sequelize.QueryTypes.INSERT
    });
    
    const photo = result[0];
    
    logger.info(`Photo uploaded: ${fileKey}`, { 
      photoId: photo.id, 
      reportId, 
      fleetId: fleet_id 
    });
    
    res.status(201).json({ photo });
  } catch (error) {
    logger.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Upload audio for report
router.post('/audio/:reportId', [
  authenticate,
  requirePermission('reports', 'write'),
  enforceFleetContext,
  upload.single('audio')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!req.file.mimetype.startsWith('audio/')) {
      return res.status(400).json({ error: 'File must be an audio file' });
    }
    
    const { reportId } = req.params;
    const fleet_id = req.user.fleet_id;
    
    // Verify report exists
    const [reports] = await sequelize.query(`
      SELECT id FROM accident_reports 
      WHERE id = :report_id AND fleet_id = :fleet_id
    `, {
      replacements: { report_id: reportId, fleet_id },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Generate unique file key
    const fileKey = `fleet-${fleet_id}/reports/${reportId}/audio/${uuidv4()}-${req.file.originalname}`;
    
    // Upload to S3
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'private'
    };
    
    const s3Result = await s3.upload(uploadParams).promise();
    
    // Save audio record (duration would need to be extracted from audio file)
    const [result] = await sequelize.query(`
      INSERT INTO report_audio 
        (report_id, fleet_id, file_key, file_url, file_size, duration_seconds)
      VALUES 
        (:report_id, :fleet_id, :file_key, :file_url, :file_size, :duration_seconds)
      RETURNING *
    `, {
      replacements: {
        report_id: reportId,
        fleet_id,
        file_key: fileKey,
        file_url: s3Result.Location,
        file_size: req.file.size,
        duration_seconds: null // Would need audio processing library
      },
      type: sequelize.QueryTypes.INSERT
    });
    
    const audio = result[0];
    
    logger.info(`Audio uploaded: ${fileKey}`, { 
      audioId: audio.id, 
      reportId, 
      fleetId: fleet_id 
    });
    
    res.status(201).json({ audio });
  } catch (error) {
    logger.error('Audio upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

// Get signed URL for file access
router.get('/signed-url/:fileKey', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { fileKey } = req.params;
    const fleet_id = req.user.fleet_id;
    
    // Verify file belongs to fleet
    if (!fileKey.startsWith(`fleet-${fleet_id}/`)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Generate signed URL (valid for 1 hour)
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Expires: 3600
    });
    
    res.json({ signed_url: signedUrl });
  } catch (error) {
    logger.error('Get signed URL error:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

module.exports = router;

