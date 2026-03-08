const express = require('express');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../database/connection');
const { authenticate, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT v.id, v.vehicle_number, v.vin, v.make, v.model, v.year,
             v.license_plate, v.is_active, v.kill_switch_enabled, v.kill_switch_status,
             v.last_location_lat, v.last_location_lng, v.last_location_updated_at,
             v.created_at, v.updated_at,
             u.first_name as driver_first_name, u.last_name as driver_last_name
      FROM vehicles v
      LEFT JOIN users u ON v.current_driver_id = u.id
      WHERE v.fleet_id = :fleet_id
    `;
    const replacements = { fleet_id: req.user.fleet_id, limit: parseInt(limit), offset: parseInt(offset) };

    if (status === 'active') {
      query += ` AND v.is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND v.is_active = false`;
    }

    query += ` ORDER BY v.created_at DESC LIMIT :limit OFFSET :offset`;

    const [vehicles] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total FROM vehicles WHERE fleet_id = :fleet_id
    `, {
      replacements: { fleet_id: req.user.fleet_id },
      type: sequelize.QueryTypes.SELECT
    });

    const total = parseInt(countResult?.total || 0);

    res.json({
      vehicles: vehicles || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.get('/:id', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { id } = req.params;

    const [vehicles] = await sequelize.query(`
      SELECT v.*, u.first_name as driver_first_name, u.last_name as driver_last_name
      FROM vehicles v
      LEFT JOIN users u ON v.current_driver_id = u.id
      WHERE v.id = :id AND v.fleet_id = :fleet_id
    `, {
      replacements: { id, fleet_id: req.user.fleet_id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle: vehicles[0] });
  } catch (error) {
    logger.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

router.post('/', [
  authenticate,
  requirePermission('vehicles', 'create'),
  enforceFleetContext,
  body('vehicle_number').trim().notEmpty(),
  body('make').optional().trim(),
  body('model').optional().trim(),
  body('year').optional().isInt({ min: 1900, max: 2100 }),
  body('vin').optional().trim().isLength({ min: 17, max: 17 }),
  body('license_plate').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { vehicle_number, make, model, year, vin, license_plate } = req.body;
    const fleet_id = req.user.fleet_id;

    const [existing] = await sequelize.query(`
      SELECT id FROM vehicles WHERE vehicle_number = :vehicle_number AND fleet_id = :fleet_id
    `, {
      replacements: { vehicle_number, fleet_id },
      type: sequelize.QueryTypes.SELECT
    });

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Vehicle number already exists in this fleet' });
    }

    const [result] = await sequelize.query(`
      INSERT INTO vehicles (fleet_id, vehicle_number, make, model, year, vin, license_plate)
      VALUES (:fleet_id, :vehicle_number, :make, :model, :year, :vin, :license_plate)
      RETURNING id, vehicle_number, make, model, year, vin, license_plate, is_active, created_at
    `, {
      replacements: { fleet_id, vehicle_number, make: make || null, model: model || null, year: year || null, vin: vin || null, license_plate: license_plate || null },
      type: sequelize.QueryTypes.INSERT
    });

    const vehicle = result[0];
    logger.info(`Vehicle created: ${vehicle_number}`, { vehicleId: vehicle.id, fleetId: fleet_id, createdBy: req.user.userId });

    res.status(201).json({ vehicle });
  } catch (error) {
    logger.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

router.put('/:id', [
  authenticate,
  requirePermission('vehicles', 'write'),
  enforceFleetContext,
  body('vehicle_number').optional().trim().notEmpty(),
  body('make').optional().trim(),
  body('model').optional().trim(),
  body('year').optional().isInt({ min: 1900, max: 2100 }),
  body('vin').optional().trim().isLength({ min: 17, max: 17 }),
  body('license_plate').optional().trim(),
  body('is_active').optional().isBoolean(),
  body('current_driver_id').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const fleet_id = req.user.fleet_id;

    const updates = {};
    const allowedFields = ['vehicle_number', 'make', 'model', 'year', 'vin', 'license_plate', 'is_active', 'current_driver_id'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updated_at = new Date();

    const setClause = Object.keys(updates).map(key => `"${key}" = :${key}`).join(', ');
    const [result] = await sequelize.query(`
      UPDATE vehicles
      SET ${setClause}
      WHERE id = :id AND fleet_id = :fleet_id
      RETURNING id, vehicle_number, make, model, year, vin, license_plate, is_active
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

module.exports = router;
