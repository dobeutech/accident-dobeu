const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Map Replit PG env vars to DB_* vars if not already set
if (!process.env.DB_HOST && process.env.PGHOST) process.env.DB_HOST = process.env.PGHOST;
if (!process.env.DB_PORT && process.env.PGPORT) process.env.DB_PORT = process.env.PGPORT;
if (!process.env.DB_NAME && process.env.PGDATABASE) process.env.DB_NAME = process.env.PGDATABASE;
if (!process.env.DB_USER && process.env.PGUSER) process.env.DB_USER = process.env.PGUSER;
if (!process.env.DB_PASSWORD && process.env.PGPASSWORD) process.env.DB_PASSWORD = process.env.PGPASSWORD;

// Production-ready connection pool configuration
const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
  idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000,
  evict: 1000, // Check for idle connections every second
  maxUses: 1000 // Close connection after 1000 uses to prevent memory leaks
};

// SSL configuration (Supabase/Neon require SSL; use for production or when DB_SSL=true)
const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
const dialectOptions = useSsl ? {
  ssl: {
    require: true,
    rejectUnauthorized: false
  },
  keepAlive: true,
  statement_timeout: 30000, // 30 seconds
  idle_in_transaction_session_timeout: 60000 // 60 seconds
} : {
  keepAlive: true
};

// Prefer DATABASE_URL for Supabase, Neon, and other connection-string providers
// Cloud providers (Supabase/Neon) require SSL; enable when DATABASE_URL is set or DB_SSL=true
const useSslForUrl = !!process.env.DATABASE_URL || useSsl;

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      logging: process.env.NODE_ENV === 'production' ? false : (msg) => logger.debug(msg),
      pool: poolConfig,
      dialectOptions: useSslForUrl ? dialectOptions : { keepAlive: true },
      retry: {
        max: 3,
        timeout: 3000,
        match: [
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/,
          /TimeoutError/
        ]
      },
      benchmark: process.env.NODE_ENV !== 'production',
      logQueryParameters: process.env.NODE_ENV !== 'production'
    })
  : new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'production' 
      ? false 
      : (msg) => logger.debug(msg),
    pool: poolConfig,
    dialectOptions,
    retry: {
      max: 3,
      timeout: 3000,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/
      ]
    },
    benchmark: process.env.NODE_ENV !== 'production',
    logQueryParameters: process.env.NODE_ENV !== 'production'
  }
);

// Monitor pool health
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const pool = sequelize.connectionManager.pool;
    logger.info('Database pool status', {
      size: pool.size,
      available: pool.available,
      using: pool.using,
      waiting: pool.waiting
    });
  }, 60000); // Log every minute
}

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Setup query monitoring in production
if (process.env.NODE_ENV === 'production') {
  const { setupQueryMonitoring, startPeriodicMonitoring } = require('../middleware/queryMonitoring');
  setupQueryMonitoring(sequelize);
  startPeriodicMonitoring(sequelize, 5 * 60 * 1000); // Every 5 minutes
}

module.exports = { sequelize, testConnection };

