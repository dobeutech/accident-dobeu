const jwt = require('jsonwebtoken');
const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    // Try cookie first (web), then Authorization header (mobile)
    let token = req.cookies?.auth_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Set user context for RLS
      req.user = decoded;
      
      // Set PostgreSQL session variables for RLS (use parameterized queries to prevent SQL injection)
      if (decoded.fleet_id) {
        await sequelize.query('SET app.current_fleet_id = :fleet_id', {
          replacements: { fleet_id: decoded.fleet_id }
        });
      }
      await sequelize.query('SET app.user_role = :role', {
        replacements: { role: decoded.role }
      });
      await sequelize.query('SET app.user_id = :user_id', {
        replacements: { user_id: decoded.userId }
      });
      
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Super admin has all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }
      
      // Check permission in database
      const [permissions] = await sequelize.query(`
        SELECT * FROM permissions 
        WHERE role = :role 
        AND (resource = :resource OR resource = '*')
        AND (action = :action OR action = '*')
      `, {
        replacements: { 
          role: req.user.role, 
          resource, 
          action 
        },
        type: sequelize.QueryTypes.SELECT
      });
      
      if (permissions.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

module.exports = {
  authenticate,
  requireRole,
  requirePermission
};

