const logger = require('./logger');

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Required variables - support both Replit PG* and DB_* naming conventions
  const required = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DB_HOST: process.env.PGHOST || process.env.DB_HOST,
    DB_PORT: process.env.PGPORT || process.env.DB_PORT,
    DB_NAME: process.env.PGDATABASE || process.env.DB_NAME,
    DB_USER: process.env.PGUSER || process.env.DB_USER,
    DB_PASSWORD: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET || process.env.SESSION_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET
  };

  // Check required variables (support DATABASE_URL as alternative)
  const hasDbUrl = !!process.env.DATABASE_URL;
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      if (key.startsWith('DB_') && hasDbUrl) {
        continue;
      }
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate JWT_SECRET length (use SESSION_SECRET as fallback)
  const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  // Validate SESSION_SECRET length
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    errors.push('SESSION_SECRET must be at least 32 characters long');
  }

  // Validate PORT
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    // AWS S3 required in production
    if (!process.env.AWS_REGION) {
      errors.push('AWS_REGION is required in production');
    }
    if (!process.env.AWS_ACCESS_KEY_ID) {
      errors.push('AWS_ACCESS_KEY_ID is required in production');
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      errors.push('AWS_SECRET_ACCESS_KEY is required in production');
    }
    if (!process.env.AWS_S3_BUCKET) {
      errors.push('AWS_S3_BUCKET is required in production');
    }

    // CORS should be specific in production
    if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*') {
      warnings.push('CORS_ORIGIN should be set to specific domains in production');
    }

    // Cookie security
    if (process.env.COOKIE_SECURE !== 'true') {
      warnings.push('COOKIE_SECURE should be true in production');
    }

    // SSL/TLS for database
    if (!process.env.DB_SSL || process.env.DB_SSL !== 'true') {
      warnings.push('DB_SSL should be enabled in production');
    }
  }

  // Optional but recommended
  const recommended = {
    LOG_LEVEL: process.env.LOG_LEVEL,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS
  };

  for (const [key, value] of Object.entries(recommended)) {
    if (!value) {
      warnings.push(`Recommended environment variable not set: ${key} (using default)`);
    }
  }

  // Log results
  if (errors.length > 0) {
    logger.error('Environment validation failed:');
    errors.forEach(error => logger.error(`  - ${error}`));
    return false;
  }

  if (warnings.length > 0) {
    logger.warn('Environment validation warnings:');
    warnings.forEach(warning => logger.warn(`  - ${warning}`));
  }

  logger.info('Environment validation passed');
  return true;
}

/**
 * Validate database connection
 */
async function validateDatabase() {
  const { sequelize } = require('../database/connection');
  
  try {
    await sequelize.authenticate();
    logger.info('Database connection validated');
    
    // Check if migrations are up to date
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const requiredTables = [
      'fleets',
      'users',
      'permissions',
      'accident_reports',
      'fleet_form_configs'
    ];
    
    const existingTables = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      logger.error('Missing required database tables:', missingTables);
      logger.error('Please run database migrations: npm run migrate');
      return false;
    }
    
    logger.info('Database schema validated');
    return true;
  } catch (error) {
    logger.error('Database validation failed:', error.message);
    return false;
  }
}

/**
 * Validate AWS S3 connection
 */
async function validateS3() {
  if (process.env.NODE_ENV !== 'production' && !process.env.AWS_S3_BUCKET) {
    logger.info('Skipping S3 validation (not configured)');
    return true;
  }

  try {
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
    logger.info('S3 bucket access validated');
    return true;
  } catch (error) {
    logger.error('S3 validation failed:', error.message);
    return false;
  }
}

/**
 * Run all validations
 */
async function runStartupValidation() {
  logger.info('Running startup validation...');
  
  const envValid = validateEnvironment();
  if (!envValid) {
    logger.error('Startup validation failed: Invalid environment configuration');
    process.exit(1);
  }

  const dbValid = await validateDatabase();
  if (!dbValid) {
    logger.error('Startup validation failed: Database validation failed');
    process.exit(1);
  }

  const s3Valid = await validateS3();
  if (!s3Valid && process.env.NODE_ENV === 'production') {
    logger.error('Startup validation failed: S3 validation failed');
    process.exit(1);
  }

  logger.info('✓ All startup validations passed');
  return true;
}

module.exports = {
  validateEnvironment,
  validateDatabase,
  validateS3,
  runStartupValidation
};
