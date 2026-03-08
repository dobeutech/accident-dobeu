const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { getUserFeatures, getAllFeatures, updateFeatureFlag } = require('../utils/featureFlags');

const router = express.Router();

// Get user's available features
router.get('/me', authenticate, (req, res) => {
  try {
    const features = getUserFeatures(req.user);
    res.json({ features });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get features' });
  }
});

// Get all feature flags (admin only)
router.get('/', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const features = getAllFeatures();
    res.json({ features });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get feature flags' });
  }
});

// Update feature flag (admin only)
router.patch('/:featureName', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const { featureName } = req.params;
    const { enabled, rolloutPercentage } = req.body;

    const feature = updateFeatureFlag(featureName, {
      enabled,
      rolloutPercentage
    });

    res.json({
      message: 'Feature flag updated',
      feature: {
        name: featureName,
        enabled: feature.enabled,
        rolloutPercentage: feature.rolloutPercentage
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
