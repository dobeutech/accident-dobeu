const logger = require('../utils/logger');

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`, { 
      userId: socket.user?.userId, 
      fleetId: socket.fleetId 
    });
    
    // Join fleet room for real-time updates
    if (socket.fleetId) {
      socket.join(`fleet:${socket.fleetId}`);
    }
    
    // Handle report photo upload (real-time)
    socket.on('report:photo:uploaded', (data) => {
      const { reportId, photoUrl } = data;
      // Broadcast to all managers in the fleet
      socket.to(`fleet:${socket.fleetId}`).emit('report:photo:new', {
        reportId,
        photoUrl,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle report started notification
    socket.on('report:started', (data) => {
      const { reportId } = data;
      // Notify managers in the fleet
      socket.to(`fleet:${socket.fleetId}`).emit('report:new', {
        reportId,
        driverId: socket.user.userId,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle report status update
    socket.on('report:status:updated', (data) => {
      const { reportId, status } = data;
      socket.to(`fleet:${socket.fleetId}`).emit('report:status:changed', {
        reportId,
        status,
        timestamp: new Date().toISOString()
      });
    });
    
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

