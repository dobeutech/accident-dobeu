const express = require('express');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../database/connection');
const { authenticate, requirePermission } = require('../middleware/auth');
const { enforceFleetContext } = require('../middleware/fleetContext');
const logger = require('../utils/logger');

const router = express.Router();

// Get form configuration for fleet
router.get('/', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const fleet_id = req.user.fleet_id;
    
    const [configs] = await sequelize.query(`
      SELECT * FROM fleet_form_configs
      WHERE fleet_id = :fleet_id
      ORDER BY section, order_index, created_at
    `, {
      replacements: { fleet_id },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({ form_configs: configs });
  } catch (error) {
    logger.error('Get form configs error:', error);
    res.status(500).json({ error: 'Failed to fetch form configurations' });
  }
});

// Get single form field config
router.get('/:id', authenticate, enforceFleetContext, async (req, res) => {
  try {
    const { id } = req.params;
    const fleet_id = req.user.fleet_id;
    
    const [configs] = await sequelize.query(`
      SELECT * FROM fleet_form_configs
      WHERE id = :id AND fleet_id = :fleet_id
    `, {
      replacements: { id, fleet_id },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!configs || configs.length === 0) {
      return res.status(404).json({ error: 'Form configuration not found' });
    }
    
    res.json({ form_config: configs[0] });
  } catch (error) {
    logger.error('Get form config error:', error);
    res.status(500).json({ error: 'Failed to fetch form configuration' });
  }
});

// Create form field configuration
router.post('/', [
  authenticate,
  requirePermission('form_configs', 'write'),
  enforceFleetContext,
  body('field_key').trim().notEmpty(),
  body('field_type').isIn(['text', 'number', 'date', 'datetime', 'dropdown', 'checkbox', 'radio', 'textarea', 'file', 'signature']),
  body('label').trim().notEmpty(),
  body('is_required').optional().isBoolean(),
  body('order_index').optional().isInt(),
  body('section').optional().trim(),
  body('placeholder').optional().trim(),
  body('validation_rules').optional().isObject(),
  body('options').optional().isArray(),
  body('default_value').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      field_key, field_type, label, placeholder, is_required, order_index,
      validation_rules, options, default_value, section
    } = req.body;
    const fleet_id = req.user.fleet_id;
    
    // Check if field_key already exists for this fleet
    const [existing] = await sequelize.query(`
      SELECT id FROM fleet_form_configs 
      WHERE fleet_id = :fleet_id AND field_key = :field_key
    `, {
      replacements: { fleet_id, field_key },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Field key already exists for this fleet' });
    }
    
    const [result] = await sequelize.query(`
      INSERT INTO fleet_form_configs 
        (fleet_id, field_key, field_type, label, placeholder, is_required, 
         order_index, validation_rules, options, default_value, section)
      VALUES 
        (:fleet_id, :field_key, :field_type, :label, :placeholder, :is_required,
         :order_index, :validation_rules, :options, :default_value, :section)
      RETURNING *
    `, {
      replacements: {
        fleet_id,
        field_key,
        field_type,
        label,
        placeholder: placeholder || null,
        is_required: is_required || false,
        order_index: order_index || 0,
        validation_rules: JSON.stringify(validation_rules || {}),
        options: JSON.stringify(options || []),
        default_value: default_value || null,
        section: section || null
      },
      type: sequelize.QueryTypes.INSERT
    });
    
    const config = result[0];
    
    logger.info(`Form config created: ${field_key}`, { 
      configId: config.id, 
      fleetId: fleet_id,
      createdBy: req.user.userId 
    });
    
    res.status(201).json({ form_config: config });
  } catch (error) {
    logger.error('Create form config error:', error);
    res.status(500).json({ error: 'Failed to create form configuration' });
  }
});

// Update form field configuration
router.put('/:id', [
  authenticate,
  requirePermission('form_configs', 'write'),
  enforceFleetContext,
  body('field_type').optional().isIn(['text', 'number', 'date', 'datetime', 'dropdown', 'checkbox', 'radio', 'textarea', 'file', 'signature']),
  body('label').optional().trim().notEmpty(),
  body('is_required').optional().isBoolean(),
  body('order_index').optional().isInt(),
  body('section').optional().trim(),
  body('placeholder').optional().trim(),
  body('validation_rules').optional().isObject(),
  body('options').optional().isArray(),
  body('default_value').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const fleet_id = req.user.fleet_id;
    
    const updates = {};
    const allowedFields = ['field_type', 'label', 'placeholder', 'is_required', 'order_index', 
                          'validation_rules', 'options', 'default_value', 'section'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'validation_rules' || field === 'options') {
          updates[field] = JSON.stringify(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.updated_at = new Date();
    
    const setClause = Object.keys(updates).map(key => `${key} = :${key}`).join(', ');
    const [result] = await sequelize.query(`
      UPDATE fleet_form_configs 
      SET ${setClause}
      WHERE id = :id AND fleet_id = :fleet_id
      RETURNING *
    `, {
      replacements: { id, fleet_id, ...updates },
      type: sequelize.QueryTypes.UPDATE
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Form configuration not found' });
    }
    
    logger.info(`Form config updated: ${id}`, { updatedBy: req.user.userId });
    
    res.json({ form_config: result[0] });
  } catch (error) {
    logger.error('Update form config error:', error);
    res.status(500).json({ error: 'Failed to update form configuration' });
  }
});

// Delete form field configuration
router.delete('/:id', authenticate, requirePermission('form_configs', 'delete'), enforceFleetContext, async (req, res) => {
  try {
    const { id } = req.params;
    const fleet_id = req.user.fleet_id;
    
    const [result] = await sequelize.query(`
      DELETE FROM fleet_form_configs 
      WHERE id = :id AND fleet_id = :fleet_id 
      RETURNING id
    `, {
      replacements: { id, fleet_id },
      type: sequelize.QueryTypes.DELETE
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Form configuration not found' });
    }
    
    logger.info(`Form config deleted: ${id}`, { deletedBy: req.user.userId });
    
    res.json({ message: 'Form configuration deleted successfully' });
  } catch (error) {
    logger.error('Delete form config error:', error);
    res.status(500).json({ error: 'Failed to delete form configuration' });
  }
});

module.exports = router;

