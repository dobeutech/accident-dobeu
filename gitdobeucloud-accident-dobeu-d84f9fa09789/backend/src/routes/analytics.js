const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { getAnalyticsSummary, getUserAnalytics } = require('../middleware/analytics');

const router = express.Router();

// Get analytics summary (admin only)
router.get('/summary', authenticate, requireRole('super_admin', 'fleet_admin'), (req, res) => {
  try {
    const summary = getAnalyticsSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
});

// Get user analytics (admin or own data)
router.get('/users/:userId', authenticate, (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only view their own analytics unless they're admin
    if (userId !== req.user.userId && !['super_admin', 'fleet_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const analytics = getUserAnalytics(userId);
    
    if (!analytics) {
      return res.status(404).json({ error: 'No analytics data found for user' });
    }

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
});

module.exports = router;
