const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');

// Middleware to enforce fleet context and prevent cross-fleet data access
const enforceFleetContext = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Super admin can access all fleets
    if (req.user.role === 'super_admin') {
      // Allow fleet_id override in query/body for super admin
      if (req.query.fleet_id || req.body.fleet_id) {
        const fleetId = req.query.fleet_id || req.body.fleet_id;
        await sequelize.query('SET app.current_fleet_id = :fleetId', {
          replacements: { fleetId }
        });
      }
      return next();
    }
    
    // All other users are restricted to their fleet
    if (!req.user.fleet_id) {
      return res.status(403).json({ error: 'No fleet context available' });
    }
    
    // Ensure all requests use the user's fleet_id
    if (req.body.fleet_id && req.body.fleet_id !== req.user.fleet_id) {
      return res.status(403).json({ error: 'Cannot access other fleet data' });
    }
    
    if (req.query.fleet_id && req.query.fleet_id !== req.user.fleet_id) {
      return res.status(403).json({ error: 'Cannot access other fleet data' });
    }
    
    // Set fleet_id in body/query if not present
    if (!req.body.fleet_id) {
      req.body.fleet_id = req.user.fleet_id;
    }
    
    next();
  } catch (error) {
    logger.error('Fleet context enforcement error:', error);
    return res.status(500).json({ error: 'Fleet context enforcement failed' });
  }
};

module.exports = { enforceFleetContext };

