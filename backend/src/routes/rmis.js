const express = require('express');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../database/connection');
const { authenticate, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const rmisService = require('../services/rmisService');
const logger = require('../utils/logger');

const router = express.Router();

// Get all RMIS integrations for fleet
router.get('/integrations', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const fleet_id = req.user.fleet_id;
    
    const [integrations] = await sequelize.query(`
      SELECT id, integration_type, is_active, created_at, updated_at,
             config::jsonb - 'apiKey' - 'password' as config
      FROM rmis_integrations
      WHERE fleet_id = :fleet_id
    `, {
      replacements: { fleet_id },
      type: sequelize.QueryTypes.SELECT,
    });
    
    res.json({ integrations });
  } catch (error) {
    logger.error('Get RMIS integrations error:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Configure RMIS integration
router.post('/integrations', [
  authenticate,
  requirePermission('rmis', 'write'),
  enforceFleetContext,
  body('integration_type').isIn(['origami_risk', 'riskonnect', 'custom_api']),
  body('config').isObject(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { integration_type, config } = req.body;
    const fleet_id = req.user.fleet_id;
    
    await rmisService.registerIntegration(fleet_id, integration_type, config);
    
    logger.info(`RMIS integration configured: ${integration_type}`, { 
      fleetId: fleet_id,
      configuredBy: req.user.userId 
    });
    
    res.status(201).json({ message: 'Integration configured successfully' });
  } catch (error) {
    logger.error('Configure RMIS integration error:', error);
    res.status(500).json({ error: 'Failed to configure integration' });
  }
});

// Update RMIS integration
router.put('/integrations/:type', [
  authenticate,
  requirePermission('rmis', 'write'),
  enforceFleetContext,
  body('config').isObject(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { type } = req.params;
    const { config } = req.body;
    const fleet_id = req.user.fleet_id;
    
    await rmisService.registerIntegration(fleet_id, type, config);
    
    res.json({ message: 'Integration updated successfully' });
  } catch (error) {
    logger.error('Update RMIS integration error:', error);
    res.status(500).json({ error: 'Failed to update integration' });
  }
});

// Delete RMIS integration
router.delete('/integrations/:type', authenticate, requirePermission('rmis', 'delete'), enforceFleetContext, async (req, res) => {
  try {
    const { type } = req.params;
    const fleet_id = req.user.fleet_id;
    
    await sequelize.query(`
      DELETE FROM rmis_integrations 
      WHERE fleet_id = :fleet_id AND integration_type = :type
    `, {
      replacements: { fleet_id, type },
      type: sequelize.QueryTypes.DELETE,
    });
    
    res.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    logger.error('Delete RMIS integration error:', error);
    res.status(500).json({ error: 'Failed to delete integration' });
  }
});

// Test RMIS integration connection
router.post('/integrations/:type/test', authenticate, requirePermission('rmis', 'write'), enforceFleetContext, async (req, res) => {
  try {
    const { type } = req.params;
    const fleet_id = req.user.fleet_id;
    
    // Create a test report payload
    const testReport = {
      id: 'test-report-id',
      report_number: 'TEST-001',
      incident_type: 'accident',
      incident_date: new Date().toISOString(),
      address: '123 Test Street, Test City, TS 12345',
      latitude: 40.7128,
      longitude: -74.0060,
      driver_id: req.user.userId,
      driver_name: 'Test Driver',
      driver_email: 'test@example.com',
      custom_fields: {
        vehicle_number: 'UNIT-001',
        vehicle_year: '2023',
        vehicle_make: 'Ford',
        vehicle_model: 'F-150',
        driver_statement: 'This is a test connection.',
      },
      created_at: new Date().toISOString(),
    };
    
    let result;
    switch (type) {
      case 'origami_risk':
        result = await rmisService.pushToOrigamiRisk(fleet_id, testReport);
        break;
      case 'riskonnect':
        result = await rmisService.pushToRiskonnect(fleet_id, testReport);
        break;
      case 'custom_api':
        result = await rmisService.pushToCustomAPI(fleet_id, testReport);
        break;
      default:
        return res.status(400).json({ error: 'Invalid integration type' });
    }
    
    if (result.success) {
      res.json({ message: 'Connection test successful', details: result });
    } else {
      res.status(400).json({ error: 'Connection test failed', details: result });
    }
  } catch (error) {
    logger.error('Test RMIS integration error:', error);
    res.status(500).json({ error: 'Failed to test integration' });
  }
});

// Push report to RMIS
router.post('/push/:reportId', authenticate, requirePermission('rmis', 'write'), enforceFleetContext, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { integration_type } = req.body;
    const fleet_id = req.user.fleet_id;
    
    // Get the report
    const [reports] = await sequelize.query(`
      SELECT r.*, 
             u.first_name || ' ' || u.last_name as driver_name,
             u.email as driver_email
      FROM accident_reports r
      LEFT JOIN users u ON r.driver_id = u.id
      WHERE r.id = :report_id AND r.fleet_id = :fleet_id
    `, {
      replacements: { report_id: reportId, fleet_id },
      type: sequelize.QueryTypes.SELECT,
    });
    
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = reports[0];
    
    // Get photos and audio
    const [photos] = await sequelize.query(`
      SELECT * FROM report_photos WHERE report_id = :report_id
    `, {
      replacements: { report_id: reportId },
      type: sequelize.QueryTypes.SELECT,
    });
    
    const [audio] = await sequelize.query(`
      SELECT * FROM report_audio WHERE report_id = :report_id
    `, {
      replacements: { report_id: reportId },
      type: sequelize.QueryTypes.SELECT,
    });
    
    report.photos = photos;
    report.audio = audio;
    
    let result;
    if (integration_type) {
      // Push to specific integration
      switch (integration_type) {
        case 'origami_risk':
          result = await rmisService.pushToOrigamiRisk(fleet_id, report);
          break;
        case 'riskonnect':
          result = await rmisService.pushToRiskonnect(fleet_id, report);
          break;
        case 'custom_api':
          result = await rmisService.pushToCustomAPI(fleet_id, report);
          break;
        default:
          return res.status(400).json({ error: 'Invalid integration type' });
      }
    } else {
      // Push to all configured integrations
      result = await rmisService.autoPushReport(fleet_id, report);
    }
    
    logger.info(`Report ${reportId} pushed to RMIS`, { 
      fleetId: fleet_id,
      pushedBy: req.user.userId,
      result 
    });
    
    res.json({ message: 'Report pushed successfully', result });
  } catch (error) {
    logger.error('Push to RMIS error:', error);
    res.status(500).json({ error: 'Failed to push report to RMIS' });
  }
});

// Get RMIS integration logs
router.get('/logs', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const fleet_id = req.user.fleet_id;
    const { integration_type, status, report_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE fleet_id = :fleet_id';
    const replacements = { fleet_id, limit: parseInt(limit), offset: parseInt(offset) };
    
    if (integration_type) {
      whereClause += ' AND integration_type = :integration_type';
      replacements.integration_type = integration_type;
    }
    
    if (status) {
      whereClause += ' AND status = :status';
      replacements.status = status;
    }
    
    if (report_id) {
      whereClause += ' AND report_id = :report_id';
      replacements.report_id = report_id;
    }
    
    const [logs] = await sequelize.query(`
      SELECT l.*, r.report_number
      FROM rmis_integration_logs l
      LEFT JOIN accident_reports r ON l.report_id = r.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });
    
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM rmis_integration_logs
      ${whereClause}
    `, {
      replacements: { ...replacements, limit: undefined, offset: undefined },
      type: sequelize.QueryTypes.SELECT,
    });
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult[0].total),
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    logger.error('Get RMIS logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;
