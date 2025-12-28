const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');
const telematicsService = require('./telematicsService');
const imageValidationService = require('./imageValidationService');

class WorkflowService {
  constructor() {
    // Define required workflow steps
    this.defaultSteps = [
      { id: 'basic_info', name: 'Basic Information', required: true },
      { id: 'location', name: 'Location Data', required: true },
      { id: 'photos', name: 'Accident Photos', required: true, minCount: 2 },
      { id: 'photo_validation', name: 'Photo Validation', required: true },
      { id: 'description', name: 'Incident Description', required: true },
      { id: 'witnesses', name: 'Witness Information', required: false },
      { id: 'police_report', name: 'Police Report Number', required: false },
      { id: 'submission', name: 'Report Submission', required: true }
    ];
  }

  /**
   * Initialize workflow for a report
   */
  async initializeWorkflow(reportId, fleetId, vehicleId, driverId, customSteps = null) {
    try {
      logger.info(`Initializing workflow for report ${reportId}`);

      const steps = customSteps || this.defaultSteps;
      const requiredSteps = steps.filter(s => s.required);

      const [result] = await sequelize.query(`
        INSERT INTO workflow_completions
          (report_id, fleet_id, vehicle_id, driver_id, steps_required, steps_completed, completion_percentage)
        VALUES
          (:report_id, :fleet_id, :vehicle_id, :driver_id, :steps_required, '[]', 0)
        RETURNING *
      `, {
        replacements: {
          report_id: reportId,
          fleet_id: fleetId,
          vehicle_id: vehicleId,
          driver_id: driverId,
          steps_required: JSON.stringify(requiredSteps)
        },
        type: sequelize.QueryTypes.INSERT
      });

      logger.info(`Workflow initialized for report ${reportId}`);
      return result[0];

    } catch (error) {
      logger.error(`Failed to initialize workflow for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Update workflow step completion
   */
  async updateStepCompletion(reportId, stepId, completed = true, metadata = {}) {
    try {
      logger.info(`Updating workflow step ${stepId} for report ${reportId}`);

      // Get current workflow
      const [workflows] = await sequelize.query(`
        SELECT * FROM workflow_completions
        WHERE report_id = :report_id
      `, {
        replacements: { report_id: reportId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!workflows || workflows.length === 0) {
        throw new Error('Workflow not found');
      }

      const workflow = workflows[0];
      const stepsCompleted = JSON.parse(workflow.steps_completed || '[]');
      const stepsRequired = JSON.parse(workflow.steps_required || '[]');

      // Update completed steps
      if (completed && !stepsCompleted.find(s => s.id === stepId)) {
        stepsCompleted.push({
          id: stepId,
          completedAt: new Date().toISOString(),
          metadata
        });
      } else if (!completed) {
        const index = stepsCompleted.findIndex(s => s.id === stepId);
        if (index > -1) {
          stepsCompleted.splice(index, 1);
        }
      }

      // Calculate completion percentage
      const completionPercentage = Math.round(
        (stepsCompleted.length / stepsRequired.length) * 100
      );

      const isComplete = completionPercentage === 100;

      // Update workflow
      await sequelize.query(`
        UPDATE workflow_completions
        SET steps_completed = :steps_completed,
            completion_percentage = :completion_percentage,
            is_complete = :is_complete,
            completed_at = CASE WHEN :is_complete THEN CURRENT_TIMESTAMP ELSE completed_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE report_id = :report_id
      `, {
        replacements: {
          report_id: reportId,
          steps_completed: JSON.stringify(stepsCompleted),
          completion_percentage: completionPercentage,
          is_complete: isComplete
        },
        type: sequelize.QueryTypes.UPDATE
      });

      // Check if workflow is complete and release kill switch
      if (isComplete && workflow.kill_switch_engaged) {
        await this.releaseKillSwitch(reportId, workflow.driver_id);
      }

      // Check if workflow is incomplete and should engage kill switch
      if (!isComplete && workflow.vehicle_id) {
        await telematicsService.checkAndEngageKillSwitch(reportId);
      }

      logger.info(`Workflow step ${stepId} updated for report ${reportId}. Completion: ${completionPercentage}%`);

      return {
        reportId,
        stepId,
        completed,
        completionPercentage,
        isComplete,
        stepsCompleted: stepsCompleted.length,
        stepsRequired: stepsRequired.length
      };

    } catch (error) {
      logger.error(`Failed to update workflow step for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Check workflow completion status
   */
  async checkWorkflowStatus(reportId) {
    try {
      const [workflows] = await sequelize.query(`
        SELECT wc.*,
               v.vehicle_number,
               v.kill_switch_status,
               u.first_name || ' ' || u.last_name as driver_name
        FROM workflow_completions wc
        LEFT JOIN vehicles v ON wc.vehicle_id = v.id
        LEFT JOIN users u ON wc.driver_id = u.id
        WHERE wc.report_id = :report_id
      `, {
        replacements: { report_id: reportId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!workflows || workflows.length === 0) {
        return null;
      }

      const workflow = workflows[0];
      const stepsRequired = JSON.parse(workflow.steps_required || '[]');
      const stepsCompleted = JSON.parse(workflow.steps_completed || '[]');

      return {
        ...workflow,
        steps_required: stepsRequired,
        steps_completed: stepsCompleted,
        pending_steps: stepsRequired.filter(
          req => !stepsCompleted.find(comp => comp.id === req.id)
        )
      };

    } catch (error) {
      logger.error(`Failed to check workflow status for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Validate all photos in report
   */
  async validateReportPhotos(reportId) {
    try {
      logger.info(`Validating photos for report ${reportId}`);

      // Get all photos for the report
      const [photos] = await sequelize.query(`
        SELECT * FROM report_photos
        WHERE report_id = :report_id AND validation_required = true
        ORDER BY order_index
      `, {
        replacements: { report_id: reportId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!photos || photos.length === 0) {
        logger.warn(`No photos found for report ${reportId}`);
        return { success: false, message: 'No photos to validate' };
      }

      // Validate each photo
      const validationResults = await imageValidationService.batchValidateImages(photos);

      // Check if all photos are valid
      const allValid = validationResults.every(
        r => r.success && ['valid', 'manual_review'].includes(r.result?.status)
      );

      // Update workflow step
      if (allValid) {
        await this.updateStepCompletion(reportId, 'photo_validation', true, {
          photosValidated: photos.length,
          validationResults
        });
      }

      logger.info(`Photo validation completed for report ${reportId}. All valid: ${allValid}`);

      return {
        success: true,
        allValid,
        totalPhotos: photos.length,
        validationResults
      };

    } catch (error) {
      logger.error(`Failed to validate photos for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Release kill switch when workflow is complete
   */
  async releaseKillSwitch(reportId, userId) {
    try {
      logger.info(`Releasing kill switch for report ${reportId}`);

      // Get workflow
      const [workflows] = await sequelize.query(`
        SELECT * FROM workflow_completions
        WHERE report_id = :report_id AND kill_switch_engaged = true
      `, {
        replacements: { report_id: reportId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!workflows || workflows.length === 0) {
        return { success: false, message: 'No active kill switch found' };
      }

      const workflow = workflows[0];

      // Disengage kill switch
      await telematicsService.disengageKillSwitch(
        workflow.vehicle_id,
        reportId,
        userId,
        'Workflow completed successfully'
      );

      // Update workflow
      await sequelize.query(`
        UPDATE workflow_completions
        SET kill_switch_engaged = false,
            kill_switch_released_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :workflow_id
      `, {
        replacements: { workflow_id: workflow.id },
        type: sequelize.QueryTypes.UPDATE
      });

      logger.info(`Kill switch released for report ${reportId}`);

      return {
        success: true,
        message: 'Kill switch released. Vehicle is now operational.'
      };

    } catch (error) {
      logger.error(`Failed to release kill switch for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Request supervisor override
   */
  async requestSupervisorOverride(reportId, vehicleId, userId, reason, urgency = 'medium') {
    try {
      logger.info(`Supervisor override requested for report ${reportId}`);

      // Get workflow
      const [workflows] = await sequelize.query(`
        SELECT * FROM workflow_completions
        WHERE report_id = :report_id
      `, {
        replacements: { report_id: reportId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!workflows || workflows.length === 0) {
        throw new Error('Workflow not found');
      }

      const workflow = workflows[0];

      // Create override request
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // Expires in 2 hours

      const [result] = await sequelize.query(`
        INSERT INTO supervisor_override_requests
          (workflow_completion_id, report_id, vehicle_id, fleet_id, requested_by_user_id, 
           reason, urgency, expires_at)
        VALUES
          (:workflow_id, :report_id, :vehicle_id, :fleet_id, :user_id, :reason, :urgency, :expires_at)
        RETURNING *
      `, {
        replacements: {
          workflow_id: workflow.id,
          report_id: reportId,
          vehicle_id: vehicleId,
          fleet_id: workflow.fleet_id,
          user_id: userId,
          reason,
          urgency,
          expires_at: expiresAt
        },
        type: sequelize.QueryTypes.INSERT
      });

      // Update workflow
      await sequelize.query(`
        UPDATE workflow_completions
        SET override_requested = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :workflow_id
      `, {
        replacements: { workflow_id: workflow.id },
        type: sequelize.QueryTypes.UPDATE
      });

      logger.info(`Supervisor override request created for report ${reportId}`);

      return result[0];

    } catch (error) {
      logger.error(`Failed to request supervisor override for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Approve supervisor override
   */
  async approveSupervisorOverride(overrideRequestId, supervisorId, notes = '') {
    try {
      logger.info(`Approving supervisor override ${overrideRequestId}`);

      // Get override request
      const [requests] = await sequelize.query(`
        SELECT * FROM supervisor_override_requests
        WHERE id = :request_id AND status = 'pending'
      `, {
        replacements: { request_id: overrideRequestId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!requests || requests.length === 0) {
        throw new Error('Override request not found or already processed');
      }

      const request = requests[0];

      // Update override request
      await sequelize.query(`
        UPDATE supervisor_override_requests
        SET status = 'approved',
            supervisor_id = :supervisor_id,
            supervisor_notes = :notes,
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :request_id
      `, {
        replacements: {
          request_id: overrideRequestId,
          supervisor_id: supervisorId,
          notes
        },
        type: sequelize.QueryTypes.UPDATE
      });

      // Update workflow
      await sequelize.query(`
        UPDATE workflow_completions
        SET override_approved = true,
            override_by_supervisor_id = :supervisor_id,
            override_reason = :notes,
            override_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :workflow_id
      `, {
        replacements: {
          workflow_id: request.workflow_completion_id,
          supervisor_id: supervisorId,
          notes
        },
        type: sequelize.QueryTypes.UPDATE
      });

      // Disengage kill switch
      await telematicsService.disengageKillSwitch(
        request.vehicle_id,
        request.report_id,
        supervisorId,
        `Supervisor override approved: ${notes}`
      );

      // Log event
      await telematicsService.logKillSwitchEvent(
        request.vehicle_id,
        request.fleet_id,
        request.report_id,
        'override_approved',
        supervisorId,
        notes
      );

      logger.info(`Supervisor override approved for request ${overrideRequestId}`);

      return {
        success: true,
        message: 'Override approved. Kill switch released.'
      };

    } catch (error) {
      logger.error(`Failed to approve supervisor override ${overrideRequestId}:`, error);
      throw error;
    }
  }

  /**
   * Deny supervisor override
   */
  async denySupervisorOverride(overrideRequestId, supervisorId, reason) {
    try {
      logger.info(`Denying supervisor override ${overrideRequestId}`);

      // Get override request
      const [requests] = await sequelize.query(`
        SELECT * FROM supervisor_override_requests
        WHERE id = :request_id AND status = 'pending'
      `, {
        replacements: { request_id: overrideRequestId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!requests || requests.length === 0) {
        throw new Error('Override request not found or already processed');
      }

      const request = requests[0];

      // Update override request
      await sequelize.query(`
        UPDATE supervisor_override_requests
        SET status = 'denied',
            supervisor_id = :supervisor_id,
            supervisor_notes = :reason,
            denied_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :request_id
      `, {
        replacements: {
          request_id: overrideRequestId,
          supervisor_id: supervisorId,
          reason
        },
        type: sequelize.QueryTypes.UPDATE
      });

      // Log event
      await telematicsService.logKillSwitchEvent(
        request.vehicle_id,
        request.fleet_id,
        request.report_id,
        'override_denied',
        supervisorId,
        reason
      );

      logger.info(`Supervisor override denied for request ${overrideRequestId}`);

      return {
        success: true,
        message: 'Override denied. Kill switch remains engaged.'
      };

    } catch (error) {
      logger.error(`Failed to deny supervisor override ${overrideRequestId}:`, error);
      throw error;
    }
  }

  /**
   * Get pending override requests for supervisor
   */
  async getPendingOverrideRequests(fleetId, supervisorId = null) {
    try {
      let whereClause = 'WHERE sor.fleet_id = :fleet_id AND sor.status = \'pending\' AND sor.expires_at > CURRENT_TIMESTAMP';
      const replacements = { fleet_id: fleetId };

      if (supervisorId) {
        whereClause += ' AND (sor.supervisor_id = :supervisor_id OR sor.supervisor_id IS NULL)';
        replacements.supervisor_id = supervisorId;
      }

      const [requests] = await sequelize.query(`
        SELECT sor.*,
               v.vehicle_number,
               u.first_name || ' ' || u.last_name as requested_by_name,
               ar.report_number,
               ar.incident_type
        FROM supervisor_override_requests sor
        JOIN vehicles v ON sor.vehicle_id = v.id
        JOIN users u ON sor.requested_by_user_id = u.id
        JOIN accident_reports ar ON sor.report_id = ar.id
        ${whereClause}
        ORDER BY sor.urgency DESC, sor.created_at ASC
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      return requests;

    } catch (error) {
      logger.error('Failed to get pending override requests:', error);
      throw error;
    }
  }
}

module.exports = new WorkflowService();
