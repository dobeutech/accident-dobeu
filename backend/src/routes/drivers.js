const express = require('express');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../database/connection');
const { authenticate, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const { hashPassword } = require('../utils/password');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
             u.is_active, u.last_login, u.created_at
      FROM users u
      WHERE u.fleet_id = :fleet_id AND u.role = 'driver'
    `;
    const replacements = {
      fleet_id: req.user.fleet_id,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    if (status === 'active') {
      query += ` AND u.is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND u.is_active = false`;
    }

    query += ` ORDER BY u.created_at DESC LIMIT :limit OFFSET :offset`;

    const [drivers] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    const [countResult] = await sequelize.query(
      `
      SELECT COUNT(*) as total FROM users WHERE fleet_id = :fleet_id AND role = 'driver'
    `,
      {
        replacements: { fleet_id: req.user.fleet_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const total = parseInt(countResult?.total || 0);

    res.json({
      drivers: drivers || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

router.get('/:id', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { id } = req.params;

    const [drivers] = await sequelize.query(
      `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
             u.is_active, u.last_login, u.created_at
      FROM users u
      WHERE u.id = :id AND u.fleet_id = :fleet_id AND u.role = 'driver'
    `,
      {
        replacements: { id, fleet_id: req.user.fleet_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!drivers || drivers.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: drivers[0] });
  } catch (error) {
    logger.error('Get driver error:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

router.post(
  '/',
  [
    authenticate,
    requirePermission('users', 'write'),
    enforceFleetContext,
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').trim().notEmpty(),
    body('last_name').trim().notEmpty(),
    body('phone').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, first_name, last_name, phone } = req.body;
      const fleet_id = req.user.fleet_id;

      const [existing] = await sequelize.query(
        `
      SELECT id FROM users WHERE email = :email AND fleet_id = :fleet_id
    `,
        {
          replacements: { email, fleet_id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (existing && existing.length > 0) {
        return res.status(400).json({ error: 'Driver with this email already exists' });
      }

      const password_hash = await hashPassword(password);

      const [result] = await sequelize.query(
        `
      INSERT INTO users (email, password_hash, first_name, last_name, role, fleet_id, phone)
      VALUES (:email, :password_hash, :first_name, :last_name, 'driver', :fleet_id, :phone)
      RETURNING id, email, first_name, last_name, role, phone, created_at
    `,
        {
          replacements: { email, password_hash, first_name, last_name, fleet_id, phone },
          type: sequelize.QueryTypes.INSERT,
        }
      );

      const driver = result[0];
      logger.info(`Driver created: ${email}`, {
        driverId: driver.id,
        fleetId: fleet_id,
        createdBy: req.user.userId,
      });

      res.status(201).json({ driver });
    } catch (error) {
      logger.error('Create driver error:', error);
      res.status(500).json({ error: 'Failed to create driver' });
    }
  }
);

router.put(
  '/:id',
  [
    authenticate,
    requirePermission('users', 'write'),
    enforceFleetContext,
    body('first_name').optional().trim().notEmpty(),
    body('last_name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('is_active').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const fleet_id = req.user.fleet_id;

      const updates = {};
      const allowedFields = ['first_name', 'last_name', 'phone', 'is_active'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updates.updated_at = new Date();

      const setClause = Object.keys(updates)
        .map(key => `${key} = :${key}`)
        .join(', ');
      const [result] = await sequelize.query(
        `
      UPDATE users
      SET ${setClause}
      WHERE id = :id AND fleet_id = :fleet_id AND role = 'driver'
      RETURNING id, email, first_name, last_name, phone, is_active
    `,
        {
          replacements: { id, fleet_id, ...updates },
          type: sequelize.QueryTypes.UPDATE,
        }
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      logger.info(`Driver updated: ${id}`, { updatedBy: req.user.userId });
      res.json({ driver: result[0] });
    } catch (error) {
      logger.error('Update driver error:', error);
      res.status(500).json({ error: 'Failed to update driver' });
    }
  }
);

module.exports = router;
