const express = require('express');
const { query } = require('express-validator');
const { authenticate, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const exportService = require('../services/exportService');
const logger = require('../utils/logger');

const router = express.Router();

// Export reports in various formats
router.get('/reports', [
  authenticate,
  requirePermission('exports', 'read'),
  enforceFleetContext,
  query('format').isIn(['pdf', 'docx', 'xlsx', 'csv', 'xml', 'json', 'zip']),
  query('report_ids').optional().isString()
], async (req, res) => {
  try {
    const { format, report_ids } = req.query;
    const fleet_id = req.user.fleet_id;
    
    let reportIds = [];
    if (report_ids) {
      reportIds = report_ids.split(',').filter(id => id.trim());
    }
    
    const result = await exportService.exportReports(fleet_id, format, reportIds);
    
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    
    res.send(result.data);
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;

