const express = require('express');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../database/connection');
const { authenticate, requireRole, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const { hashPassword } = require('../utils/password');
const logger = require('../utils/logger');

const router = express.Router();

// Get all users in fleet
router.get('/', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const [users] = await sequelize.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, 
             u.phone, u.is_active, u.last_login, u.created_at
      FROM users u
      WHERE u.fleet_id = :fleet_id
      ORDER BY u.created_at DESC
    `, {
      replacements: { fleet_id: req.user.fleet_id },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({ users });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await sequelize.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, 
             u.phone, u.is_active, u.last_login, u.created_at
      FROM users u
      WHERE u.id = :id AND u.fleet_id = :fleet_id
    `, {
      replacements: { id, fleet_id: req.user.fleet_id },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: users[0] });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user (fleet admin only)
router.post('/', [
  authenticate,
  requirePermission('users', 'write'),
  enforceFleetContext,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('role').isIn(['fleet_admin', 'fleet_manager', 'fleet_viewer', 'driver']),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, first_name, last_name, role, phone } = req.body;
    const fleet_id = req.user.fleet_id;
    
    // Check if user already exists in this fleet
    const [existing] = await sequelize.query(`
      SELECT id FROM users WHERE email = :email AND fleet_id = :fleet_id
    `, {
      replacements: { email, fleet_id },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'User already exists in this fleet' });
    }
    
    // Hash password
    const password_hash = await hashPassword(password);
    
    // Create user
    const [result] = await sequelize.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, fleet_id, phone)
      VALUES (:email, :password_hash, :first_name, :last_name, :role, :fleet_id, :phone)
      RETURNING id, email, first_name, last_name, role, created_at
    `, {
      replacements: { email, password_hash, first_name, last_name, role, fleet_id, phone },
      type: sequelize.QueryTypes.INSERT
    });
    
    const user = result[0];
    
    logger.info(`User created: ${email}`, { userId: user.id, fleetId: fleet_id, createdBy: req.user.userId });
    
    res.status(201).json({ user });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', [
  authenticate,
  requirePermission('users', 'write'),
  enforceFleetContext,
  body('first_name').optional().trim().notEmpty(),
  body('last_name').optional().trim().notEmpty(),
  body('role').optional().isIn(['fleet_admin', 'fleet_manager', 'fleet_viewer', 'driver']),
  body('phone').optional().trim(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const fleet_id = req.user.fleet_id;
    
    const updates = {};
    const allowedFields = ['first_name', 'last_name', 'role', 'phone', 'is_active'];
    
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
      UPDATE users 
      SET ${setClause}
      WHERE id = :id AND fleet_id = :fleet_id
      RETURNING id, email, first_name, last_name, role, phone, is_active
    `, {
      replacements: { id, fleet_id, ...updates },
      type: sequelize.QueryTypes.UPDATE
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info(`User updated: ${id}`, { updatedBy: req.user.userId });
    
    res.json({ user: result[0] });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', authenticate, requirePermission('users', 'delete'), enforceFleetContext, async (req, res) => {
  try {
    const { id } = req.params;
    const fleet_id = req.user.fleet_id;
    
    // Prevent self-deletion
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const [result] = await sequelize.query(`
      DELETE FROM users WHERE id = :id AND fleet_id = :fleet_id RETURNING id
    `, {
      replacements: { id, fleet_id },
      type: sequelize.QueryTypes.DELETE
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info(`User deleted: ${id}`, { deletedBy: req.user.userId });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;

