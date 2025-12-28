const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      socket.fleetId = decoded.fleet_id;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  } catch (error) {
    logger.error('Socket auth middleware error:', error);
    next(new Error('Authentication error'));
  }
};

module.exports = socketAuth;

