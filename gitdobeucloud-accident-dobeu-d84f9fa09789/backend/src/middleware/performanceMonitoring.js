const logger = require('../utils/logger');

// Track request metrics
const requestMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  slowRequests: 0,
  endpoints: new Map()
};

// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const endpoint = `${req.method} ${req.route?.path || req.path}`;

  // Track request start
  requestMetrics.totalRequests++;

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Update metrics
    requestMetrics.totalResponseTime += duration;
    
    if (res.statusCode >= 200 && res.statusCode < 400) {
      requestMetrics.successfulRequests++;
    } else {
      requestMetrics.failedRequests++;
    }

    // Track slow requests (>1 second)
    if (duration > 1000) {
      requestMetrics.slowRequests++;
      logger.warn('Slow request detected', {
        endpoint,
        duration,
        statusCode: res.statusCode,
        method: req.method,
        path: req.path
      });
    }

    // Track per-endpoint metrics
    if (!requestMetrics.endpoints.has(endpoint)) {
      requestMetrics.endpoints.set(endpoint, {
        count: 0,
        totalTime: 0,
        errors: 0,
        slowCount: 0
      });
    }

    const endpointMetrics = requestMetrics.endpoints.get(endpoint);
    endpointMetrics.count++;
    endpointMetrics.totalTime += duration;
    if (res.statusCode >= 400) endpointMetrics.errors++;
    if (duration > 1000) endpointMetrics.slowCount++;

    // Log performance for monitoring
    logger.performance('Request completed', duration, {
      endpoint,
      statusCode: res.statusCode,
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    originalSend.call(this, data);
  };

  next();
};

// Get current metrics
const getMetrics = () => {
  const avgResponseTime = requestMetrics.totalRequests > 0
    ? requestMetrics.totalResponseTime / requestMetrics.totalRequests
    : 0;

  const successRate = requestMetrics.totalRequests > 0
    ? (requestMetrics.successfulRequests / requestMetrics.totalRequests) * 100
    : 0;

  const endpointStats = Array.from(requestMetrics.endpoints.entries()).map(([endpoint, stats]) => ({
    endpoint,
    count: stats.count,
    avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
    errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0,
    slowRate: stats.count > 0 ? (stats.slowCount / stats.count) * 100 : 0
  })).sort((a, b) => b.count - a.count);

  return {
    summary: {
      totalRequests: requestMetrics.totalRequests,
      successfulRequests: requestMetrics.successfulRequests,
      failedRequests: requestMetrics.failedRequests,
      successRate: successRate.toFixed(2) + '%',
      avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
      slowRequests: requestMetrics.slowRequests,
      slowRequestRate: requestMetrics.totalRequests > 0
        ? ((requestMetrics.slowRequests / requestMetrics.totalRequests) * 100).toFixed(2) + '%'
        : '0%'
    },
    endpoints: endpointStats.slice(0, 20), // Top 20 endpoints
    timestamp: new Date().toISOString()
  };
};

// Reset metrics
const resetMetrics = () => {
  requestMetrics.totalRequests = 0;
  requestMetrics.successfulRequests = 0;
  requestMetrics.failedRequests = 0;
  requestMetrics.totalResponseTime = 0;
  requestMetrics.slowRequests = 0;
  requestMetrics.endpoints.clear();
};

// Log metrics periodically
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const metrics = getMetrics();
    logger.info('Performance metrics', metrics.summary);
    
    // Log top 5 slowest endpoints
    const slowest = metrics.endpoints
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
    
    if (slowest.length > 0) {
      logger.info('Slowest endpoints', slowest);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

module.exports = {
  performanceMonitoring,
  getMetrics,
  resetMetrics
};
