const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { sequelize } = require('../database/connection');
const { authenticate, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const router = express.Router();

// Get all reports
router.get('/', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { status, incident_type, driver_id, start_date, end_date, page = 1, limit = 20 } = req.query;
    const fleet_id = req.user.fleet_id;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE r.fleet_id = :fleet_id';
    const replacements = { fleet_id, limit: parseInt(limit), offset: parseInt(offset) };
    
    if (status) {
      whereClause += ' AND r.status = :status';
      replacements.status = status;
    }
    
    if (incident_type) {
      whereClause += ' AND r.incident_type = :incident_type';
      replacements.incident_type = incident_type;
    }
    
    if (driver_id) {
      whereClause += ' AND r.driver_id = :driver_id';
      replacements.driver_id = driver_id;
    }
    
    if (start_date) {
      whereClause += ' AND r.incident_date >= :start_date';
      replacements.start_date = start_date;
    }
    
    if (end_date) {
      whereClause += ' AND r.incident_date <= :end_date';
      replacements.end_date = end_date;
    }
    
    // Drivers can only see their own reports
    if (req.user.role === 'driver') {
      whereClause += ' AND r.driver_id = :user_id';
      replacements.user_id = req.user.userId;
    }
    
    const [reports] = await sequelize.query(`
      SELECT r.*, 
             u.first_name || ' ' || u.last_name as driver_name,
             u.email as driver_email,
             COUNT(DISTINCT p.id) as photo_count,
             COUNT(DISTINCT a.id) as audio_count
      FROM accident_reports r
      LEFT JOIN users u ON r.driver_id = u.id
      LEFT JOIN report_photos p ON p.report_id = r.id
      LEFT JOIN report_audio a ON a.report_id = r.id
      ${whereClause}
      GROUP BY r.id, u.first_name, u.last_name, u.email
      ORDER BY r.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM accident_reports r
      ${whereClause}
    `, {
      replacements: { ...replacements, limit: undefined, offset: undefined },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult[0].total),
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get single report
router.get('/:id', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { id } = req.params;
    const fleet_id = req.user.fleet_id;
    
    let whereClause = 'WHERE r.id = :id AND r.fleet_id = :fleet_id';
    const replacements = { id, fleet_id };
    
    // Drivers can only see their own reports
    if (req.user.role === 'driver') {
      whereClause += ' AND r.driver_id = :user_id';
      replacements.user_id = req.user.userId;
    }
    
    const [reports] = await sequelize.query(`
      SELECT r.*, 
             u.first_name || ' ' || u.last_name as driver_name,
             u.email as driver_email,
             u.phone as driver_phone
      FROM accident_reports r
      LEFT JOIN users u ON r.driver_id = u.id
      ${whereClause}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = reports[0];
    
    // Get photos
    const [photos] = await sequelize.query(`
      SELECT * FROM report_photos 
      WHERE report_id = :id 
      ORDER BY order_index, created_at
    `, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get audio
    const [audio] = await sequelize.query(`
      SELECT * FROM report_audio 
      WHERE report_id = :id 
      ORDER BY created_at
    `, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      report: {
        ...report,
        photos,
        audio
      }
    });
  } catch (error) {
    logger.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Create report
router.post('/', [
  authenticate,
  requirePermission('reports', 'create'),
  enforceFleetContext,
  body('incident_type').isIn(['accident', 'incident', 'near_miss']),
  body('incident_date').optional().isISO8601(),
  body('latitude').optional().isFloat(),
  body('longitude').optional().isFloat(),
  body('address').optional().trim(),
  body('custom_fields').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { incident_type, incident_date, latitude, longitude, address, custom_fields } = req.body;
    const fleet_id = req.user.fleet_id;
    const driver_id = req.user.role === 'driver' ? req.user.userId : req.body.driver_id;
    
    // Generate report number
    const report_number = `RPT-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    const [result] = await sequelize.query(`
      INSERT INTO accident_reports 
        (fleet_id, driver_id, report_number, incident_type, incident_date, 
         latitude, longitude, address, custom_fields, status)
      VALUES 
        (:fleet_id, :driver_id, :report_number, :incident_type, :incident_date,
         :latitude, :longitude, :address, :custom_fields, 'draft')
      RETURNING *
    `, {
      replacements: {
        fleet_id,
        driver_id,
        report_number,
        incident_type,
        incident_date: incident_date || new Date(),
        latitude,
        longitude,
        address,
        custom_fields: JSON.stringify(custom_fields || {})
      },
      type: sequelize.QueryTypes.INSERT
    });
    
    const report = result[0];
    
    logger.info(`Report created: ${report_number}`, { 
      reportId: report.id, 
      fleetId: fleet_id,
      createdBy: req.user.userId 
    });
    
    res.status(201).json({ report });
  } catch (error) {
    logger.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Update report
router.put('/:id', [
  authenticate,
  requirePermission('reports', 'write'),
  enforceFleetContext,
  body('status').optional().isIn(['draft', 'submitted', 'under_review', 'closed']),
  body('incident_type').optional().isIn(['accident', 'incident', 'near_miss']),
  body('custom_fields').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const fleet_id = req.user.fleet_id;
    
    const updates = {};
    const allowedFields = ['status', 'incident_type', 'incident_date', 'latitude', 'longitude', 'address', 'custom_fields'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'custom_fields') {
          updates[field] = JSON.stringify(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.updated_at = new Date();
    
    const setClause = Object.keys(updates).map(key => `${key} = :${key}`).join(', ');
    const [result] = await sequelize.query(`
      UPDATE accident_reports 
      SET ${setClause}
      WHERE id = :id AND fleet_id = :fleet_id
      RETURNING *
    `, {
      replacements: { id, fleet_id, ...updates },
      type: sequelize.QueryTypes.UPDATE
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    logger.info(`Report updated: ${id}`, { updatedBy: req.user.userId });
    
    res.json({ report: result[0] });
  } catch (error) {
    logger.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Delete report
router.delete('/:id', authenticate, requirePermission('reports', 'delete'), enforceFleetContext, async (req, res) => {
  try {
    const { id } = req.params;
    const fleet_id = req.user.fleet_id;
    
    const [result] = await sequelize.query(`
      DELETE FROM accident_reports 
      WHERE id = :id AND fleet_id = :fleet_id 
      RETURNING id
    `, {
      replacements: { id, fleet_id },
      type: sequelize.QueryTypes.DELETE
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    logger.info(`Report deleted: ${id}`, { deletedBy: req.user.userId });
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    logger.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

module.exports = router;

