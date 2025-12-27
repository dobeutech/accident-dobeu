const logger = require('../utils/logger');

// Analytics data store (in production, use Redis or database)
const analyticsData = {
  users: new Map(),
  events: [],
  sessions: new Map()
};

const MAX_EVENTS = 10000;

/**
 * Track user activity
 */
const trackUserActivity = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const userId = req.user.userId;
  const now = Date.now();

  // Update user activity
  if (!analyticsData.users.has(userId)) {
    analyticsData.users.set(userId, {
      userId,
      firstSeen: now,
      lastSeen: now,
      requestCount: 0,
      endpoints: new Map()
    });
  }

  const userData = analyticsData.users.get(userId);
  userData.lastSeen = now;
  userData.requestCount++;

  // Track endpoint usage
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  const endpointCount = userData.endpoints.get(endpoint) || 0;
  userData.endpoints.set(endpoint, endpointCount + 1);

  next();
};

/**
 * Track custom events
 */
const trackEvent = (userId, eventName, properties = {}) => {
  const event = {
    userId,
    eventName,
    properties,
    timestamp: new Date().toISOString()
  };

  analyticsData.events.push(event);

  // Keep only recent events
  if (analyticsData.events.length > MAX_EVENTS) {
    analyticsData.events.shift();
  }

  logger.info('Analytics event', event);
};

/**
 * Track session
 */
const trackSession = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const userId = req.user.userId;
  const sessionId = req.sessionID || req.headers['x-session-id'];

  if (sessionId) {
    if (!analyticsData.sessions.has(sessionId)) {
      analyticsData.sessions.set(sessionId, {
        sessionId,
        userId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        requestCount: 0,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });

      trackEvent(userId, 'session_start', {
        sessionId,
        userAgent: req.headers['user-agent']
      });
    }

    const session = analyticsData.sessions.get(sessionId);
    session.lastActivity = Date.now();
    session.requestCount++;
  }

  next();
};

/**
 * Get analytics summary
 */
const getAnalyticsSummary = () => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Active users
  const activeUsersLastHour = Array.from(analyticsData.users.values())
    .filter(u => u.lastSeen > oneHourAgo).length;

  const activeUsersLastDay = Array.from(analyticsData.users.values())
    .filter(u => u.lastSeen > oneDayAgo).length;

  // Active sessions
  const activeSessions = Array.from(analyticsData.sessions.values())
    .filter(s => s.lastActivity > oneHourAgo).length;

  // Recent events
  const recentEvents = analyticsData.events
    .filter(e => new Date(e.timestamp).getTime() > oneHourAgo);

  // Event breakdown
  const eventBreakdown = {};
  recentEvents.forEach(e => {
    eventBreakdown[e.eventName] = (eventBreakdown[e.eventName] || 0) + 1;
  });

  // Top users by activity
  const topUsers = Array.from(analyticsData.users.values())
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, 10)
    .map(u => ({
      userId: u.userId,
      requestCount: u.requestCount,
      lastSeen: new Date(u.lastSeen).toISOString()
    }));

  return {
    timestamp: new Date().toISOString(),
    users: {
      total: analyticsData.users.size,
      activeLastHour: activeUsersLastHour,
      activeLastDay: activeUsersLastDay,
      topUsers
    },
    sessions: {
      total: analyticsData.sessions.size,
      active: activeSessions
    },
    events: {
      total: analyticsData.events.length,
      lastHour: recentEvents.length,
      breakdown: eventBreakdown
    }
  };
};

/**
 * Get user analytics
 */
const getUserAnalytics = (userId) => {
  const userData = analyticsData.users.get(userId);
  
  if (!userData) {
    return null;
  }

  const userEvents = analyticsData.events
    .filter(e => e.userId === userId)
    .slice(-50); // Last 50 events

  const userSessions = Array.from(analyticsData.sessions.values())
    .filter(s => s.userId === userId);

  return {
    userId,
    firstSeen: new Date(userData.firstSeen).toISOString(),
    lastSeen: new Date(userData.lastSeen).toISOString(),
    requestCount: userData.requestCount,
    endpoints: Array.from(userData.endpoints.entries()).map(([endpoint, count]) => ({
      endpoint,
      count
    })),
    recentEvents: userEvents,
    sessions: userSessions.map(s => ({
      sessionId: s.sessionId,
      startTime: new Date(s.startTime).toISOString(),
      duration: Date.now() - s.startTime,
      requestCount: s.requestCount
    }))
  };
};

/**
 * Clear old data (run periodically)
 */
const cleanupOldData = () => {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Remove old sessions
  for (const [sessionId, session] of analyticsData.sessions.entries()) {
    if (session.lastActivity < sevenDaysAgo) {
      analyticsData.sessions.delete(sessionId);
    }
  }

  // Remove old events
  analyticsData.events = analyticsData.events.filter(e => 
    new Date(e.timestamp).getTime() > sevenDaysAgo
  );

  logger.info('Analytics cleanup completed', {
    remainingSessions: analyticsData.sessions.size,
    remainingEvents: analyticsData.events.length
  });
};

// Run cleanup daily
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
}

module.exports = {
  trackUserActivity,
  trackEvent,
  trackSession,
  getAnalyticsSummary,
  getUserAnalytics,
  cleanupOldData
};
