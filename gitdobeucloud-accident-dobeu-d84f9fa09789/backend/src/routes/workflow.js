const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const workflowService = require('../services/workflowService');
const logger = require('../utils/logger');

const router = express.Router();

// Get workflow status for a report
router.get('/:reportId', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const workflow = await workflowService.checkWorkflowStatus(reportId);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Check fleet access
    if (workflow.fleet_id !== req.user.fleet_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ workflow });
  } catch (error) {
    logger.error('Get workflow status error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow status' });
  }
});

// Initialize workflow for a report
router.post('/', [
  authenticate,
  requirePermission('reports', 'create'),
  enforceFleetContext,
  body('report_id').notEmpty(),
  body('vehicle_id').notEmpty(),
  body('custom_steps').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { report_id, vehicle_id, custom_steps } = req.body;
    const fleet_id = req.user.fleet_id;
    const driver_id = req.user.role === 'driver' ? req.user.userId : req.body.driver_id;

    const workflow = await workflowService.initializeWorkflow(
      report_id,
      fleet_id,
      vehicle_id,
      driver_id,
      custom_steps
    );

    logger.info(`Workflow initialized for report ${report_id}`, { userId: req.user.userId });
    res.status(201).json({ workflow });
  } catch (error) {
    logger.error('Initialize workflow error:', error);
    res.status(500).json({ error: 'Failed to initialize workflow' });
  }
});

// Update workflow step completion
router.put('/:reportId/steps/:stepId', [
  authenticate,
  requirePermission('reports', 'write'),
  enforceFleetContext,
  body('completed').isBoolean(),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reportId, stepId } = req.params;
    const { completed, metadata } = req.body;

    const result = await workflowService.updateStepCompletion(
      reportId,
      stepId,
      completed,
      metadata
    );

    logger.info(`Workflow step ${stepId} updated for report ${reportId}`, { userId: req.user.userId });
    res.json(result);
  } catch (error) {
    logger.error('Update workflow step error:', error);
    res.status(500).json({ error: 'Failed to update workflow step' });
  }
});

// Validate report photos
router.post('/:reportId/validate-photos', [
  authenticate,
  requirePermission('reports', 'write'),
  enforceFleetContext
], async (req, res) => {
  try {
    const { reportId } = req.params;

    const result = await workflowService.validateReportPhotos(reportId);

    logger.info(`Photo validation completed for report ${reportId}`, { userId: req.user.userId });
    res.json(result);
  } catch (error) {
    logger.error('Validate photos error:', error);
    res.status(500).json({ error: 'Failed to validate photos' });
  }
});

// Request supervisor override
router.post('/:reportId/override-request', [
  authenticate,
  enforceFleetContext,
  body('vehicle_id').notEmpty(),
  body('reason').notEmpty().trim(),
  body('urgency').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reportId } = req.params;
    const { vehicle_id, reason, urgency } = req.body;

    const overrideRequest = await workflowService.requestSupervisorOverride(
      reportId,
      vehicle_id,
      req.user.userId,
      reason,
      urgency
    );

    logger.info(`Supervisor override requested for report ${reportId}`, { userId: req.user.userId });
    res.status(201).json({ overrideRequest });
  } catch (error) {
    logger.error('Request supervisor override error:', error);
    res.status(500).json({ error: 'Failed to request supervisor override' });
  }
});

// Get pending override requests (for supervisors)
router.get('/override-requests/pending', [
  authenticate,
  requirePermission('override', 'read'),
  enforceFleetContext
], async (req, res) => {
  try {
    const fleet_id = req.user.fleet_id;
    const supervisor_id = req.user.role === 'fleet_admin' || req.user.role === 'fleet_manager' 
      ? req.user.userId 
      : null;

    const requests = await workflowService.getPendingOverrideRequests(fleet_id, supervisor_id);

    res.json({ requests });
  } catch (error) {
    logger.error('Get pending override requests error:', error);
    res.status(500).json({ error: 'Failed to fetch override requests' });
  }
});

// Approve supervisor override
router.post('/override-requests/:requestId/approve', [
  authenticate,
  requirePermission('override', 'approve'),
  enforceFleetContext,
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { notes } = req.body;

    const result = await workflowService.approveSupervisorOverride(
      requestId,
      req.user.userId,
      notes
    );

    logger.info(`Supervisor override approved: ${requestId}`, { supervisorId: req.user.userId });
    res.json(result);
  } catch (error) {
    logger.error('Approve supervisor override error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve override' });
  }
});

// Deny supervisor override
router.post('/override-requests/:requestId/deny', [
  authenticate,
  requirePermission('override', 'approve'),
  enforceFleetContext,
  body('reason').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { reason } = req.body;

    const result = await workflowService.denySupervisorOverride(
      requestId,
      req.user.userId,
      reason
    );

    logger.info(`Supervisor override denied: ${requestId}`, { supervisorId: req.user.userId });
    res.json(result);
  } catch (error) {
    logger.error('Deny supervisor override error:', error);
    res.status(500).json({ error: error.message || 'Failed to deny override' });
  }
});

module.exports = router;
