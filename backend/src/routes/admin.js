const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');

const router = express.Router();

// All admin routes require super admin role
router.use(authenticate);
router.use(requireRole('super_admin'));

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM fleets) as total_fleets,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM accident_reports) as total_reports,
        (SELECT COUNT(*) FROM fleets WHERE subscription_status = 'active') as active_fleets,
        (SELECT COUNT(*) FROM accident_reports WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as reports_last_30_days
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({ stats: stats[0] });
  } catch (error) {
    logger.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all users across all fleets
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, role, fleet_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const replacements = { limit: parseInt(limit), offset: parseInt(offset) };
    
    if (role) {
      whereClause += ' AND u.role = :role';
      replacements.role = role;
    }
    
    if (fleet_id) {
      whereClause += ' AND u.fleet_id = :fleet_id';
      replacements.fleet_id = fleet_id;
    }
    
    const [users] = await sequelize.query(`
      SELECT u.*, f.name as fleet_name
      FROM users u
      LEFT JOIN fleets f ON u.fleet_id = f.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({ users });
  } catch (error) {
    logger.error('Get admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 100, fleet_id, user_id, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const replacements = { limit: parseInt(limit), offset: parseInt(offset) };
    
    if (fleet_id) {
      whereClause += ' AND al.fleet_id = :fleet_id';
      replacements.fleet_id = fleet_id;
    }
    
    if (user_id) {
      whereClause += ' AND al.user_id = :user_id';
      replacements.user_id = user_id;
    }
    
    if (start_date) {
      whereClause += ' AND al.created_at >= :start_date';
      replacements.start_date = start_date;
    }
    
    if (end_date) {
      whereClause += ' AND al.created_at <= :end_date';
      replacements.end_date = end_date;
    }
    
    const [logs] = await sequelize.query(`
      SELECT al.*, 
             u.email as user_email,
             f.name as fleet_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN fleets f ON al.fleet_id = f.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({ audit_logs: logs });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;

