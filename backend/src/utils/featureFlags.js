const logger = require('./logger');

// Feature flags configuration
const featureFlags = {
  // Core features
  agentmdReview: {
    enabled: process.env.FEATURE_AGENTMD_REVIEW === 'true',
    description: 'AI-powered report review',
    rolloutPercentage: 100
  },
  
  redTeam: {
    enabled: process.env.FEATURE_RED_TEAM === 'true',
    description: 'Security red team testing',
    rolloutPercentage: 0 // Only for admins
  },
  
  analytics: {
    enabled: process.env.FEATURE_ANALYTICS === 'true',
    description: 'User analytics and tracking',
    rolloutPercentage: 100
  },
  
  advancedExports: {
    enabled: process.env.FEATURE_ADVANCED_EXPORTS !== 'false',
    description: 'Advanced export formats (XML, JSON)',
    rolloutPercentage: 100
  },
  
  realtimeNotifications: {
    enabled: process.env.FEATURE_REALTIME_NOTIFICATIONS !== 'false',
    description: 'Real-time WebSocket notifications',
    rolloutPercentage: 100
  },
  
  offlineMode: {
    enabled: process.env.FEATURE_OFFLINE_MODE !== 'false',
    description: 'Offline support for mobile app',
    rolloutPercentage: 100
  },
  
  customForms: {
    enabled: process.env.FEATURE_CUSTOM_FORMS !== 'false',
    description: 'Custom form builder',
    rolloutPercentage: 100
  },
  
  // Experimental features
  aiAssistant: {
    enabled: process.env.FEATURE_AI_ASSISTANT === 'true',
    description: 'AI assistant for report writing',
    rolloutPercentage: 10
  },
  
  voiceInput: {
    enabled: process.env.FEATURE_VOICE_INPUT === 'true',
    description: 'Voice-to-text input',
    rolloutPercentage: 0
  },
  
  photoAnalysis: {
    enabled: process.env.FEATURE_PHOTO_ANALYSIS === 'true',
    description: 'AI-powered photo analysis',
    rolloutPercentage: 0
  }
};

/**
 * Check if a feature is enabled
 */
const isFeatureEnabled = (featureName, user = null) => {
  const feature = featureFlags[featureName];
  
  if (!feature) {
    logger.warn('Unknown feature flag', { featureName });
    return false;
  }

  // Feature is disabled globally
  if (!feature.enabled) {
    return false;
  }

  // Super admins always get all features
  if (user && user.role === 'super_admin') {
    return true;
  }

  // Check rollout percentage
  if (feature.rolloutPercentage === 100) {
    return true;
  }

  if (feature.rolloutPercentage === 0) {
    return false;
  }

  // Use user ID for consistent rollout
  if (user && user.userId) {
    const hash = hashString(user.userId);
    const percentage = hash % 100;
    return percentage < feature.rolloutPercentage;
  }

  return false;
};

/**
 * Get all feature flags for a user
 */
const getUserFeatures = (user = null) => {
  const features = {};
  
  for (const [name, config] of Object.entries(featureFlags)) {
    features[name] = {
      enabled: isFeatureEnabled(name, user),
      description: config.description
    };
  }
  
  return features;
};

/**
 * Get all feature flags (admin only)
 */
const getAllFeatures = () => {
  return Object.entries(featureFlags).map(([name, config]) => ({
    name,
    enabled: config.enabled,
    description: config.description,
    rolloutPercentage: config.rolloutPercentage
  }));
};

/**
 * Update feature flag (runtime update)
 */
const updateFeatureFlag = (featureName, updates) => {
  if (!featureFlags[featureName]) {
    throw new Error(`Unknown feature: ${featureName}`);
  }

  const feature = featureFlags[featureName];
  
  if (updates.enabled !== undefined) {
    feature.enabled = updates.enabled;
  }
  
  if (updates.rolloutPercentage !== undefined) {
    if (updates.rolloutPercentage < 0 || updates.rolloutPercentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }
    feature.rolloutPercentage = updates.rolloutPercentage;
  }

  logger.info('Feature flag updated', {
    featureName,
    enabled: feature.enabled,
    rolloutPercentage: feature.rolloutPercentage
  });

  return feature;
};

/**
 * Simple hash function for consistent rollout
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Middleware to check feature flag
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!isFeatureEnabled(featureName, req.user)) {
      return res.status(403).json({
        error: 'Feature not available',
        feature: featureName
      });
    }
    next();
  };
};

module.exports = {
  isFeatureEnabled,
  getUserFeatures,
  getAllFeatures,
  updateFeatureFlag,
  requireFeature
};
