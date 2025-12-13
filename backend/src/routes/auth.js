const express = require('express');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../database/connection');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Register new user (fleet admin or super admin only)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('role').isIn(['fleet_admin', 'fleet_manager', 'fleet_viewer', 'driver']),
  body('fleet_id').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, first_name, last_name, role, fleet_id, phone } = req.body;
    
    // Check if user already exists
    const [existing] = await sequelize.query(`
      SELECT id FROM users WHERE email = :email
    `, {
      replacements: { email },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const password_hash = await hashPassword(password);
    
    // Create user
    const [result] = await sequelize.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, fleet_id, phone)
      VALUES (:email, :password_hash, :first_name, :last_name, :role, :fleet_id, :phone)
      RETURNING id, email, first_name, last_name, role, fleet_id, created_at
    `, {
      replacements: { email, password_hash, first_name, last_name, role, fleet_id, phone },
      type: sequelize.QueryTypes.INSERT
    });
    
    const user = result[0];
    
    logger.info(`User registered: ${email}`, { userId: user.id, role });
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    // Find user
    const [users] = await sequelize.query(`
      SELECT u.*, f.name as fleet_name 
      FROM users u
      LEFT JOIN fleets f ON u.fleet_id = f.id
      WHERE u.email = :email AND u.is_active = true
    `, {
      replacements: { email },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await sequelize.query(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = :id
    `, {
      replacements: { id: user.id }
    });
    
    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fleet_id: user.fleet_id,
      fleet_name: user.fleet_name
    });
    
    logger.info(`User logged in: ${email}`, { userId: user.id, role: user.role });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        fleet_id: user.fleet_id,
        fleet_name: user.fleet_name
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await sequelize.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.fleet_id, 
             u.phone, u.last_login, f.name as fleet_name
      FROM users u
      LEFT JOIN fleets f ON u.fleet_id = f.id
      WHERE u.id = :id
    `, {
      replacements: { id: req.user.userId },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: users[0] });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;

