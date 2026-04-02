const {
  isFeatureEnabled,
  getUserFeatures,
  getAllFeatures,
  updateFeatureFlag,
  requireFeature
} = require('../../utils/featureFlags');
const logger = require('../../utils/logger');

jest.mock('../../utils/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
}));

describe('featureFlags utilities', () => {
  let originalFlags;

  beforeAll(() => {
    // Store original flags values so we can restore them later
    originalFlags = getAllFeatures().reduce((acc, feature) => {
      acc[feature.name] = {
        enabled: feature.enabled,
        rolloutPercentage: feature.rolloutPercentage
      };
      return acc;
    }, {});
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all flags to a known state using updateFeatureFlag
    // Assuming 'aiAssistant' starts with 10% and 'analytics' starts with 100%
    updateFeatureFlag('aiAssistant', { enabled: true, rolloutPercentage: 10 });
    updateFeatureFlag('analytics', { enabled: true, rolloutPercentage: 100 });
    updateFeatureFlag('redTeam', { enabled: true, rolloutPercentage: 0 });
    updateFeatureFlag('voiceInput', { enabled: false, rolloutPercentage: 0 });
  });

  afterAll(() => {
    // Restore all flags
    for (const [name, config] of Object.entries(originalFlags)) {
      updateFeatureFlag(name, config);
    }
  });

  describe('isFeatureEnabled', () => {
    it('returns false and logs warning for unknown feature', () => {
      expect(isFeatureEnabled('nonExistentFeature')).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith('Unknown feature flag', { featureName: 'nonExistentFeature' });
    });

    it('returns false if feature is disabled globally', () => {
      // voiceInput is disabled globally
      updateFeatureFlag('voiceInput', { enabled: false, rolloutPercentage: 100 });
      expect(isFeatureEnabled('voiceInput')).toBe(false);
    });

    it('returns true for super_admin even if rollout is 0', () => {
      const superAdmin = { role: 'super_admin' };
      // redTeam has 0% rollout, but should be true for super_admin
      expect(isFeatureEnabled('redTeam', superAdmin)).toBe(true);
    });

    it('returns true if rollout is 100', () => {
      expect(isFeatureEnabled('analytics')).toBe(true);
    });

    it('returns false if rollout is 0', () => {
      expect(isFeatureEnabled('redTeam')).toBe(false);
    });

    it('returns true or false based on user ID hash and percentage rollout', () => {
      // aiAssistant has 10% rollout
      // We will test with various user IDs.
      const user1 = { userId: 'user1' };
      const user2 = { userId: 'user2' };

      // Let's set the rollout to 50% to test the split
      updateFeatureFlag('aiAssistant', { enabled: true, rolloutPercentage: 50 });

      // We don't know the exact hash, but we can verify that the function works without error
      // and returns a boolean.
      const res1 = isFeatureEnabled('aiAssistant', user1);
      const res2 = isFeatureEnabled('aiAssistant', user2);

      expect(typeof res1).toBe('boolean');
      expect(typeof res2).toBe('boolean');

      // Set to 100% rollout should be true for user with ID
      updateFeatureFlag('aiAssistant', { enabled: true, rolloutPercentage: 100 });
      expect(isFeatureEnabled('aiAssistant', user1)).toBe(true);

      // Set to 0% rollout should be false for user with ID
      updateFeatureFlag('aiAssistant', { enabled: true, rolloutPercentage: 0 });
      expect(isFeatureEnabled('aiAssistant', user1)).toBe(false);
    });

    it('returns false if feature has percentage rollout but no user is provided', () => {
      // aiAssistant has 10% rollout initially, but we set it to 50%
      updateFeatureFlag('aiAssistant', { enabled: true, rolloutPercentage: 50 });
      expect(isFeatureEnabled('aiAssistant')).toBe(false);
    });
  });

  describe('getUserFeatures', () => {
    it('returns a map of features with enabled status and description', () => {
      const features = getUserFeatures();
      expect(features).toHaveProperty('analytics');
      expect(features.analytics).toHaveProperty('enabled');
      expect(features.analytics).toHaveProperty('description');
    });
  });

  describe('getAllFeatures', () => {
    it('returns an array of all features with their configs', () => {
      const features = getAllFeatures();
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);
      expect(features[0]).toHaveProperty('name');
      expect(features[0]).toHaveProperty('enabled');
      expect(features[0]).toHaveProperty('description');
      expect(features[0]).toHaveProperty('rolloutPercentage');
    });
  });

  describe('updateFeatureFlag', () => {
    it('throws an error if feature is unknown', () => {
      expect(() => {
        updateFeatureFlag('nonExistentFeature', { enabled: true });
      }).toThrow('Unknown feature: nonExistentFeature');
    });

    it('throws an error if rollout percentage is invalid', () => {
      expect(() => {
        updateFeatureFlag('analytics', { rolloutPercentage: -10 });
      }).toThrow('Rollout percentage must be between 0 and 100');

      expect(() => {
        updateFeatureFlag('analytics', { rolloutPercentage: 110 });
      }).toThrow('Rollout percentage must be between 0 and 100');
    });

    it('updates enabled and rolloutPercentage properties', () => {
      const result = updateFeatureFlag('analytics', { enabled: false, rolloutPercentage: 50 });
      expect(result.enabled).toBe(false);
      expect(result.rolloutPercentage).toBe(50);
      expect(logger.info).toHaveBeenCalledWith('Feature flag updated', expect.any(Object));

      const features = getAllFeatures();
      const analyticsConfig = features.find(f => f.name === 'analytics');
      expect(analyticsConfig.enabled).toBe(false);
      expect(analyticsConfig.rolloutPercentage).toBe(50);
    });

    it('updates only enabled property if rolloutPercentage is undefined', () => {
      updateFeatureFlag('analytics', { enabled: true, rolloutPercentage: 50 });
      const result = updateFeatureFlag('analytics', { enabled: false });
      expect(result.enabled).toBe(false);
      expect(result.rolloutPercentage).toBe(50);
    });

    it('updates only rolloutPercentage property if enabled is undefined', () => {
      updateFeatureFlag('analytics', { enabled: true, rolloutPercentage: 50 });
      const result = updateFeatureFlag('analytics', { rolloutPercentage: 60 });
      expect(result.enabled).toBe(true);
      expect(result.rolloutPercentage).toBe(60);
    });
  });

  describe('requireFeature middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = { user: null };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('calls next if feature is enabled', () => {
      updateFeatureFlag('analytics', { enabled: true, rolloutPercentage: 100 });
      const middleware = requireFeature('analytics');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 403 if feature is disabled', () => {
      updateFeatureFlag('redTeam', { enabled: true, rolloutPercentage: 0 }); // disabled for non-admins
      const middleware = requireFeature('redTeam');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Feature not available',
        feature: 'redTeam'
      });
    });

    it('returns 403 if feature does not exist', () => {
      const middleware = requireFeature('nonExistentFeature');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Feature not available',
        feature: 'nonExistentFeature'
      });
    });
  });
});
