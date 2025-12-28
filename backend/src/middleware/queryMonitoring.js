const logger = require('../utils/logger');

// Track slow queries
const slowQueries = [];
const MAX_SLOW_QUERIES = 100;
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000; // 1 second

/**
 * Query monitoring middleware for Sequelize
 */
function setupQueryMonitoring(sequelize) {
  // Hook into Sequelize logging
  sequelize.addHook('beforeQuery', (options) => {
    options.startTime = Date.now();
  });

  sequelize.addHook('afterQuery', (options, query) => {
    const duration = Date.now() - options.startTime;
    
    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      const slowQuery = {
        query: query.sql || query,
        duration,
        timestamp: new Date().toISOString(),
        bind: query.bind
      };

      slowQueries.push(slowQuery);
      
      // Keep only last MAX_SLOW_QUERIES
      if (slowQueries.length > MAX_SLOW_QUERIES) {
        slowQueries.shift();
      }

      logger.warn('Slow query detected', {
        duration,
        query: query.sql || query,
        threshold: SLOW_QUERY_THRESHOLD
      });
    }

    // Log all queries in development
    if (process.env.NODE_ENV === 'development' && process.env.LOG_QUERIES === 'true') {
      logger.debug('Query executed', {
        duration,
        query: query.sql || query
      });
    }
  });
}

/**
 * Get slow query statistics
 */
function getSlowQueryStats() {
  if (slowQueries.length === 0) {
    return {
      count: 0,
      queries: []
    };
  }

  // Calculate statistics
  const durations = slowQueries.map(q => q.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  // Group by query pattern (simplified)
  const queryPatterns = {};
  slowQueries.forEach(q => {
    // Extract query type (SELECT, INSERT, UPDATE, DELETE)
    const match = q.query.match(/^(SELECT|INSERT|UPDATE|DELETE)/i);
    const type = match ? match[1].toUpperCase() : 'OTHER';
    
    if (!queryPatterns[type]) {
      queryPatterns[type] = { count: 0, totalDuration: 0 };
    }
    queryPatterns[type].count++;
    queryPatterns[type].totalDuration += q.duration;
  });

  return {
    count: slowQueries.length,
    avgDuration: avgDuration.toFixed(2),
    maxDuration,
    minDuration,
    threshold: SLOW_QUERY_THRESHOLD,
    patterns: queryPatterns,
    recentQueries: slowQueries.slice(-10).map(q => ({
      query: q.query.substring(0, 200), // Truncate long queries
      duration: q.duration,
      timestamp: q.timestamp
    }))
  };
}

/**
 * Clear slow query history
 */
function clearSlowQueries() {
  slowQueries.length = 0;
}

/**
 * Database connection pool monitoring
 */
function getPoolStats(sequelize) {
  const pool = sequelize.connectionManager.pool;
  
  return {
    size: pool.size,
    available: pool.available,
    using: pool.using,
    waiting: pool.waiting,
    maxSize: pool.max,
    minSize: pool.min
  };
}

/**
 * Get database statistics
 */
async function getDatabaseStats(sequelize) {
  try {
    // Get database size
    const [sizeResult] = await sequelize.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    // Get table sizes
    const [tableResults] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
      LIMIT 10
    `);

    // Get active connections
    const [connectionResults] = await sequelize.query(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    // Get cache hit ratio
    const [cacheResults] = await sequelize.query(`
      SELECT 
        sum(heap_blks_read) as heap_read,
        sum(heap_blks_hit) as heap_hit,
        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
      FROM pg_statio_user_tables
    `);

    return {
      databaseSize: sizeResult[0].size,
      tables: tableResults,
      connections: connectionResults[0],
      cacheHitRatio: cacheResults[0].cache_hit_ratio 
        ? parseFloat(cacheResults[0].cache_hit_ratio).toFixed(2) + '%'
        : 'N/A',
      poolStats: getPoolStats(sequelize),
      slowQueries: getSlowQueryStats()
    };
  } catch (error) {
    logger.error('Error getting database stats:', error);
    return {
      error: error.message
    };
  }
}

/**
 * Periodic database monitoring
 */
function startPeriodicMonitoring(sequelize, intervalMs = 60000) {
  setInterval(async () => {
    try {
      const stats = await getDatabaseStats(sequelize);
      
      logger.info('Database statistics', {
        databaseSize: stats.databaseSize,
        connections: stats.connections,
        cacheHitRatio: stats.cacheHitRatio,
        poolStats: stats.poolStats,
        slowQueryCount: stats.slowQueries.count
      });

      // Alert if cache hit ratio is low
      if (stats.cacheHitRatio && parseFloat(stats.cacheHitRatio) < 90) {
        logger.warn('Low database cache hit ratio', {
          cacheHitRatio: stats.cacheHitRatio
        });
      }

      // Alert if connection pool is nearly exhausted
      if (stats.poolStats.using / stats.poolStats.maxSize > 0.8) {
        logger.warn('Database connection pool nearly exhausted', {
          using: stats.poolStats.using,
          maxSize: stats.poolStats.maxSize
        });
      }
    } catch (error) {
      logger.error('Error in periodic database monitoring:', error);
    }
  }, intervalMs);
}

module.exports = {
  setupQueryMonitoring,
  getSlowQueryStats,
  clearSlowQueries,
  getPoolStats,
  getDatabaseStats,
  startPeriodicMonitoring
};
