const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json()
);

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const isProduction = process.env.NODE_ENV === 'production';

// Configure transports
const transports = [];

// File transports for production
if (isProduction) {
  transports.push(
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 14,
      tailable: true
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 14,
      tailable: true
    }),
    // Security audit logs
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 10485760, // 10MB
      maxFiles: 30,
      tailable: true
    })
  );
}

// Console transport for development
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: isProduction ? productionFormat : developmentFormat,
  defaultMeta: { 
    service: 'accident-app-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  exitOnError: false
});

// Add security logging helper
logger.security = (message, meta = {}) => {
  logger.warn(message, { ...meta, type: 'security' });
};

// Add performance logging helper
logger.performance = (message, duration, meta = {}) => {
  logger.info(message, { ...meta, duration, type: 'performance' });
};

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({ 
    filename: path.join(logsDir, 'exceptions.log'),
    maxsize: 10485760,
    maxFiles: 7
  })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({ 
    filename: path.join(logsDir, 'rejections.log'),
    maxsize: 10485760,
    maxFiles: 7
  })
);

module.exports = logger;

