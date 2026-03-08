const express = require('express');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../database/connection');
const { authenticate, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const telematicsService = require('../services/telematicsService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/telematics/vehicles:
 *   get:
 *     summary: Get all vehicles for fleet
 *     description: Retrieve all vehicles belonging to the authenticated user's fleet
 *     tags: [Telematics]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by vehicle status
 *       - in: query
 *         name: kill_switch_enabled
 *         schema:
 *           type: boolean
 *         description: Filter by kill switch capability
 *     responses:
 *       200:
 *         description: List of vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/vehicles', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const fleet_id = req.user.fleet_id;
    const { status, kill_switch_enabled } = req.query;

    let whereClause = 'WHERE v.fleet_id = :fleet_id';
    const replacements = { fleet_id };

    if (status) {
      whereClause += ' AND v.is_active = :status';
      replacements.status = status === 'active';
    }

    if (kill_switch_enabled !== undefined) {
      whereClause += ' AND v.kill_switch_enabled = :kill_switch_enabled';
      replacements.kill_switch_enabled = kill_switch_enabled === 'true';
    }

    const [vehicles] = await sequelize.query(`
      SELECT v.*,
             u.first_name || ' ' || u.last_name as current_driver_name,
             tp.provider_name
      FROM vehicles v
      LEFT JOIN users u ON v.current_driver_id = u.id
      LEFT JOIN telematics_providers tp ON v.telematics_provider_id = tp.id
      ${whereClause}
      ORDER BY v.vehicle_number
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ vehicles });
  } catch (error) {
    logger.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get vehicle by ID
router.get('/vehicles/:id', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await telematicsService.getVehicleStatus(id);

    if (!vehicle || vehicle.fleet_id !== req.user.fleet_id) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle });
  } catch (error) {
    logger.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// Create vehicle
router.post('/vehicles', [
  authenticate,
  requirePermission('vehicles', 'create'),
  enforceFleetContext,
  body('vehicle_number').notEmpty().trim(),
  body('vin').optional().trim().isLength({ min: 17, max: 17 }),
  body('telematics_device_id').optional().trim(),
  body('kill_switch_enabled').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fleet_id = req.user.fleet_id;
    const {
      vehicle_number,
      vin,
      make,
      model,
      year,
      license_plate,
      telematics_device_id,
      telematics_provider_id,
      kill_switch_enabled,
      metadata
    } = req.body;

    const [result] = await sequelize.query(`
      INSERT INTO vehicles
        (fleet_id, vehicle_number, vin, make, model, year, license_plate,
         telematics_device_id, telematics_provider_id, kill_switch_enabled, metadata)
      VALUES
        (:fleet_id, :vehicle_number, :vin, :make, :model, :year, :license_plate,
         :telematics_device_id, :telematics_provider_id, :kill_switch_enabled, :metadata)
      RETURNING *
    `, {
      replacements: {
        fleet_id,
        vehicle_number,
        vin,
        make,
        model,
        year,
        license_plate,
        telematics_device_id,
        telematics_provider_id,
        kill_switch_enabled: kill_switch_enabled || false,
        metadata: JSON.stringify(metadata || {})
      },
      type: sequelize.QueryTypes.INSERT
    });

    logger.info(`Vehicle created: ${vehicle_number}`, { vehicleId: result[0].id, fleetId: fleet_id });
    res.status(201).json({ vehicle: result[0] });
  } catch (error) {
    logger.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Update vehicle
router.put('/vehicles/:id', [
  authenticate,
  requirePermission('vehicles', 'write'),
  enforceFleetContext
], async (req, res) => {
  try {
    const { id } = req.params;
    const fleet_id = req.user.fleet_id;

    const updates = {};
    const allowedFields = [
      'vehicle_number', 'vin', 'make', 'model', 'year', 'license_plate',
      'telematics_device_id', 'telematics_provider_id', 'kill_switch_enabled',
      'current_driver_id', 'is_active', 'metadata'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'metadata') {
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
      UPDATE vehicles
      SET ${setClause}
      WHERE id = :id AND fleet_id = :fleet_id
      RETURNING *
    `, {
      replacements: { id, fleet_id, ...updates },
      type: sequelize.QueryTypes.UPDATE
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    logger.info(`Vehicle updated: ${id}`, { updatedBy: req.user.userId });
    res.json({ vehicle: result[0] });
  } catch (error) {
    logger.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Engage kill switch
router.post('/vehicles/:id/kill-switch/engage', [
  authenticate,
  requirePermission('kill_switch', 'write'),
  enforceFleetContext,
  body('report_id').notEmpty(),
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { report_id, reason } = req.body;

    const result = await telematicsService.engageKillSwitch(
      id,
      report_id,
      req.user.userId,
      reason
    );

    logger.info(`Kill switch engaged for vehicle ${id}`, { userId: req.user.userId });
    res.json(result);
  } catch (error) {
    logger.error('Engage kill switch error:', error);
    res.status(500).json({ error: error.message || 'Failed to engage kill switch' });
  }
});

// Disengage kill switch
router.post('/vehicles/:id/kill-switch/disengage', [
  authenticate,
  requirePermission('kill_switch', 'write'),
  enforceFleetContext,
  body('report_id').notEmpty(),
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { report_id, reason } = req.body;

    const result = await telematicsService.disengageKillSwitch(
      id,
      report_id,
      req.user.userId,
      reason
    );

    logger.info(`Kill switch disengaged for vehicle ${id}`, { userId: req.user.userId });
    res.json(result);
  } catch (error) {
    logger.error('Disengage kill switch error:', error);
    res.status(500).json({ error: error.message || 'Failed to disengage kill switch' });
  }
});

// Get kill switch events
router.get('/vehicles/:id/kill-switch/events', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const [events] = await sequelize.query(`
      SELECT kse.*,
             u.first_name || ' ' || u.last_name as triggered_by_name,
             s.first_name || ' ' || s.last_name as supervisor_name,
             ar.report_number
      FROM kill_switch_events kse
      LEFT JOIN users u ON kse.triggered_by_user_id = u.id
      LEFT JOIN users s ON kse.supervisor_id = s.id
      LEFT JOIN accident_reports ar ON kse.report_id = ar.id
      WHERE kse.vehicle_id = :vehicle_id
      ORDER BY kse.created_at DESC
      LIMIT :limit
    `, {
      replacements: { vehicle_id: id, limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ events });
  } catch (error) {
    logger.error('Get kill switch events error:', error);
    res.status(500).json({ error: 'Failed to fetch kill switch events' });
  }
});

// Get telematics providers
router.get('/providers', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const fleet_id = req.user.fleet_id;

    const [providers] = await sequelize.query(`
      SELECT id, fleet_id, provider_name, api_endpoint, is_active, last_sync_at, created_at, updated_at
      FROM telematics_providers
      WHERE fleet_id = :fleet_id
      ORDER BY provider_name
    `, {
      replacements: { fleet_id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ providers });
  } catch (error) {
    logger.error('Get telematics providers error:', error);
    res.status(500).json({ error: 'Failed to fetch telematics providers' });
  }
});

// Create telematics provider
router.post('/providers', [
  authenticate,
  requirePermission('telematics', 'create'),
  enforceFleetContext,
  body('provider_name').isIn(['geotab', 'samsara', 'verizon_connect', 'fleet_complete', 'teletrac_navman', 'custom']),
  body('api_key').notEmpty(),
  body('api_endpoint').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fleet_id = req.user.fleet_id;
    const { provider_name, api_key, api_secret, api_endpoint, additional_config } = req.body;

    // Encrypt API credentials
    const api_key_encrypted = telematicsService.encrypt(api_key);
    const api_secret_encrypted = api_secret ? telematicsService.encrypt(api_secret) : null;

    const [result] = await sequelize.query(`
      INSERT INTO telematics_providers
        (fleet_id, provider_name, api_key_encrypted, api_secret_encrypted, api_endpoint, additional_config)
      VALUES
        (:fleet_id, :provider_name, :api_key_encrypted, :api_secret_encrypted, :api_endpoint, :additional_config)
      RETURNING id, fleet_id, provider_name, api_endpoint, is_active, created_at, updated_at
    `, {
      replacements: {
        fleet_id,
        provider_name,
        api_key_encrypted,
        api_secret_encrypted,
        api_endpoint,
        additional_config: JSON.stringify(additional_config || {})
      },
      type: sequelize.QueryTypes.INSERT
    });

    logger.info(`Telematics provider created: ${provider_name}`, { fleetId: fleet_id });
    res.status(201).json({ provider: result[0] });
  } catch (error) {
    logger.error('Create telematics provider error:', error);
    res.status(500).json({ error: 'Failed to create telematics provider' });
  }
});

module.exports = router;
