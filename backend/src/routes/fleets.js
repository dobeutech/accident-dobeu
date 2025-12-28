const express = require('express');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../database/connection');
const { authenticate, requireRole, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const logger = require('../utils/logger');

const router = express.Router();

// Get all fleets (super admin only)
router.get('/', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const [fleets] = await sequelize.query(`
      SELECT f.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT r.id) as report_count
      FROM fleets f
      LEFT JOIN users u ON u.fleet_id = f.id
      LEFT JOIN accident_reports r ON r.fleet_id = f.id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({ fleets });
  } catch (error) {
    logger.error('Get fleets error:', error);
    res.status(500).json({ error: 'Failed to fetch fleets' });
  }
});

// Get single fleet
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.fleet_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const [fleets] = await sequelize.query(`
      SELECT f.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT r.id) as report_count
      FROM fleets f
      LEFT JOIN users u ON u.fleet_id = f.id
      LEFT JOIN accident_reports r ON r.fleet_id = f.id
      WHERE f.id = :id
      GROUP BY f.id
    `, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!fleets || fleets.length === 0) {
      return res.status(404).json({ error: 'Fleet not found' });
    }
    
    res.json({ fleet: fleets[0] });
  } catch (error) {
    logger.error('Get fleet error:', error);
    res.status(500).json({ error: 'Failed to fetch fleet' });
  }
});

// Create fleet (super admin only)
router.post('/', [
  authenticate,
  requireRole('super_admin'),
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('company_name').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, company_name, phone, address } = req.body;
    
    // Check if fleet with email already exists
    const [existing] = await sequelize.query(`
      SELECT id FROM fleets WHERE email = :email
    `, {
      replacements: { email },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Fleet with this email already exists' });
    }
    
    const [result] = await sequelize.query(`
      INSERT INTO fleets (name, email, company_name, phone, address)
      VALUES (:name, :email, :company_name, :phone, :address)
      RETURNING *
    `, {
      replacements: { name, email, company_name, phone, address },
      type: sequelize.QueryTypes.INSERT
    });
    
    const fleet = result[0];
    
    logger.info(`Fleet created: ${name}`, { fleetId: fleet.id, createdBy: req.user.userId });
    
    res.status(201).json({ fleet });
  } catch (error) {
    logger.error('Create fleet error:', error);
    res.status(500).json({ error: 'Failed to create fleet' });
  }
});

// Update fleet
router.put('/:id', [
  authenticate,
  requireRole('super_admin', 'fleet_admin'),
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('company_name').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('subscription_status').optional().isIn(['active', 'suspended', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    
    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.fleet_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updates = {};
    const allowedFields = ['name', 'email', 'company_name', 'phone', 'address', 'subscription_status'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.updated_at = new Date();
    
    const setClause = Object.keys(updates).map(key => `${key} = :${key}`).join(', ');
    const [result] = await sequelize.query(`
      UPDATE fleets 
      SET ${setClause}
      WHERE id = :id
      RETURNING *
    `, {
      replacements: { id, ...updates },
      type: sequelize.QueryTypes.UPDATE
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Fleet not found' });
    }
    
    logger.info(`Fleet updated: ${id}`, { updatedBy: req.user.userId });
    
    res.json({ fleet: result[0] });
  } catch (error) {
    logger.error('Update fleet error:', error);
    res.status(500).json({ error: 'Failed to update fleet' });
  }
});

// Delete fleet (super admin only)
router.delete('/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await sequelize.query(`
      DELETE FROM fleets WHERE id = :id RETURNING id
    `, {
      replacements: { id },
      type: sequelize.QueryTypes.DELETE
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Fleet not found' });
    }
    
    logger.info(`Fleet deleted: ${id}`, { deletedBy: req.user.userId });
    
    res.json({ message: 'Fleet deleted successfully' });
  } catch (error) {
    logger.error('Delete fleet error:', error);
    res.status(500).json({ error: 'Failed to delete fleet' });
  }
});

module.exports = router;

