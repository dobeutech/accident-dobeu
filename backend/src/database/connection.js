const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Production-ready connection pool configuration
const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
  idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000,
  evict: 1000, // Check for idle connections every second
  maxUses: 1000 // Close connection after 1000 uses to prevent memory leaks
};

// SSL configuration for production
const dialectOptions = process.env.NODE_ENV === 'production' ? {
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

const sequelize = new Sequelize(
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

module.exports = { sequelize, testConnection };

