const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize notification service with Socket.IO instance
   */
  initialize(socketIO) {
    this.io = socketIO;
    logger.info('Notification service initialized');
  }

  /**
   * Send kill switch engagement notification
   */
  async notifyKillSwitchEngaged(vehicleId, reportId, fleetId, reason) {
    try {
      const notification = {
        type: 'kill_switch_engaged',
        vehicleId,
        reportId,
        reason,
        timestamp: new Date().toISOString(),
        priority: 'high',
      };

      // Emit to fleet room
      if (this.io) {
        this.io.to(`fleet:${fleetId}`).emit('kill_switch_event', notification);
      }

      logger.info('Kill switch engagement notification sent', {
        vehicleId,
        reportId,
        fleetId,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to send kill switch engagement notification:', error);
      throw error;
    }
  }

  /**
   * Send kill switch release notification
   */
  async notifyKillSwitchReleased(vehicleId, reportId, fleetId, reason) {
    try {
      const notification = {
        type: 'kill_switch_released',
        vehicleId,
        reportId,
        reason,
        timestamp: new Date().toISOString(),
        priority: 'medium',
      };

      if (this.io) {
        this.io.to(`fleet:${fleetId}`).emit('kill_switch_event', notification);
      }

      logger.info('Kill switch release notification sent', {
        vehicleId,
        reportId,
        fleetId,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to send kill switch release notification:', error);
      throw error;
    }
  }

  /**
   * Send workflow update notification
   */
  async notifyWorkflowUpdate(reportId, fleetId, driverId, completionPercentage, isComplete) {
    try {
      const notification = {
        type: 'workflow_update',
        reportId,
        completionPercentage,
        isComplete,
        timestamp: new Date().toISOString(),
        priority: isComplete ? 'high' : 'medium',
      };

      if (this.io) {
        // Notify fleet
        this.io.to(`fleet:${fleetId}`).emit('workflow_update', notification);

        // Notify specific driver
        if (driverId) {
          this.io.to(`user:${driverId}`).emit('workflow_update', notification);
        }
      }

      logger.info('Workflow update notification sent', {
        reportId,
        completionPercentage,
        isComplete,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to send workflow update notification:', error);
      throw error;
    }
  }

  /**
   * Send workflow completion notification
   */
  async notifyWorkflowComplete(reportId, fleetId, driverId) {
    try {
      const notification = {
        type: 'workflow_complete',
        reportId,
        timestamp: new Date().toISOString(),
        priority: 'high',
        message: 'Accident report workflow completed successfully',
      };

      if (this.io) {
        this.io.to(`fleet:${fleetId}`).emit('workflow_complete', notification);

        if (driverId) {
          this.io.to(`user:${driverId}`).emit('workflow_complete', notification);
        }
      }

      logger.info('Workflow completion notification sent', { reportId, fleetId });

      return notification;
    } catch (error) {
      logger.error('Failed to send workflow completion notification:', error);
      throw error;
    }
  }

  /**
   * Send override request notification
   */
  async notifyOverrideRequest(requestId, reportId, vehicleId, fleetId, requestedBy, reason, urgency) {
    try {
      const notification = {
        type: 'override_request',
        requestId,
        reportId,
        vehicleId,
        requestedBy,
        reason,
        urgency,
        timestamp: new Date().toISOString(),
        priority: urgency === 'critical' ? 'critical' : 'high',
      };

      if (this.io) {
        // Notify supervisors and fleet admins
        this.io.to(`fleet:${fleetId}:supervisors`).emit('override_request', notification);
      }

      logger.info('Override request notification sent', {
        requestId,
        urgency,
        fleetId,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to send override request notification:', error);
      throw error;
    }
  }

  /**
   * Send override approval notification
   */
  async notifyOverrideApproved(requestId, reportId, vehicleId, fleetId, approvedBy, requestedBy) {
    try {
      const notification = {
        type: 'override_approved',
        requestId,
        reportId,
        vehicleId,
        approvedBy,
        timestamp: new Date().toISOString(),
        priority: 'high',
        message: 'Supervisor override approved - vehicle released',
      };

      if (this.io) {
        // Notify requester
        if (requestedBy) {
          this.io.to(`user:${requestedBy}`).emit('override_response', notification);
        }

        // Notify fleet
        this.io.to(`fleet:${fleetId}`).emit('override_response', notification);
      }

      logger.info('Override approval notification sent', { requestId, fleetId });

      return notification;
    } catch (error) {
      logger.error('Failed to send override approval notification:', error);
      throw error;
    }
  }

  /**
   * Send override denial notification
   */
  async notifyOverrideDenied(requestId, reportId, vehicleId, fleetId, deniedBy, requestedBy, reason) {
    try {
      const notification = {
        type: 'override_denied',
        requestId,
        reportId,
        vehicleId,
        deniedBy,
        reason,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        message: 'Supervisor override denied',
      };

      if (this.io) {
        // Notify requester
        if (requestedBy) {
          this.io.to(`user:${requestedBy}`).emit('override_response', notification);
        }

        // Notify fleet
        this.io.to(`fleet:${fleetId}`).emit('override_response', notification);
      }

      logger.info('Override denial notification sent', { requestId, fleetId });

      return notification;
    } catch (error) {
      logger.error('Failed to send override denial notification:', error);
      throw error;
    }
  }

  /**
   * Send image validation notification
   */
  async notifyImageValidation(photoId, reportId, fleetId, driverId, status, requiresReview) {
    try {
      const notification = {
        type: 'image_validation',
        photoId,
        reportId,
        status,
        requiresReview,
        timestamp: new Date().toISOString(),
        priority: requiresReview ? 'medium' : 'low',
      };

      if (this.io) {
        // Notify driver
        if (driverId) {
          this.io.to(`user:${driverId}`).emit('image_validation', notification);
        }

        // Notify fleet if requires review
        if (requiresReview) {
          this.io.to(`fleet:${fleetId}:reviewers`).emit('image_validation', notification);
        }
      }

      logger.info('Image validation notification sent', {
        photoId,
        status,
        requiresReview,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to send image validation notification:', error);
      throw error;
    }
  }

  /**
   * Send report submission notification
   */
  async notifyReportSubmitted(reportId, fleetId, driverId, reportNumber) {
    try {
      const notification = {
        type: 'report_submitted',
        reportId,
        reportNumber,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        message: 'Accident report submitted successfully',
      };

      if (this.io) {
        // Notify fleet managers
        this.io.to(`fleet:${fleetId}:managers`).emit('report_submitted', notification);

        // Notify driver
        if (driverId) {
          this.io.to(`user:${driverId}`).emit('report_submitted', notification);
        }
      }

      logger.info('Report submission notification sent', { reportId, fleetId });

      return notification;
    } catch (error) {
      logger.error('Failed to send report submission notification:', error);
      throw error;
    }
  }

  /**
   * Send general notification to user
   */
  async notifyUser(userId, notification) {
    try {
      if (this.io) {
        this.io.to(`user:${userId}`).emit('notification', {
          ...notification,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info('User notification sent', { userId, type: notification.type });

      return notification;
    } catch (error) {
      logger.error('Failed to send user notification:', error);
      throw error;
    }
  }

  /**
   * Send general notification to fleet
   */
  async notifyFleet(fleetId, notification) {
    try {
      if (this.io) {
        this.io.to(`fleet:${fleetId}`).emit('notification', {
          ...notification,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info('Fleet notification sent', { fleetId, type: notification.type });

      return notification;
    } catch (error) {
      logger.error('Failed to send fleet notification:', error);
      throw error;
    }
  }

  /**
   * Get notification history for user
   */
  async getNotificationHistory(userId, limit = 50) {
    // This would typically query a notifications table
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    // This would typically update a notifications table
    logger.info('Notification marked as read', { notificationId, userId });
    return true;
  }
}

module.exports = new NotificationService();
