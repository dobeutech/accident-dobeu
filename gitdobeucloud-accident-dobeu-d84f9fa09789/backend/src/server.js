require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { csrfProtection } = require('./middleware/csrf');
const { createServer } = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');
const { runStartupValidation } = require('./utils/validateEnv');

// Run startup validation
runStartupValidation().catch(error => {
  logger.error('Startup validation failed:', error);
  process.exit(1);
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
}));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CSRF protection (exclude auth routes and health check)
const csrf = csrfProtection();
app.use((req, res, next) => {
  if (req.path === '/health' || 
      req.path.startsWith('/api/auth/login') || 
      req.path.startsWith('/api/auth/register')) {
    return next();
  }
  csrf(req, res, next);
});

// CSRF token endpoint (uses middleware to generate consistent tokens)
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Request validation and sanitization
const { 
  sanitizeParams, 
  validateResponse,
  validateBodySize 
} = require('./middleware/requestValidation');
app.use(sanitizeParams);
app.use(validateResponse);
app.use(validateBodySize());

// Request logging and performance monitoring
const { performanceMonitoring } = require('./middleware/performanceMonitoring');
app.use(performanceMonitoring);
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Fleet Accident Reporting API',
}));

// OpenAPI JSON spec
app.get('/api/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check routes
app.use('/health', require('./routes/health'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/fleets', require('./routes/fleets'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/form-configs', require('./routes/formConfigs'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/telematics', require('./routes/telematics'));
app.use('/api/workflow', require('./routes/workflow'));

// Socket.IO for real-time features
io.use(require('./middleware/socketAuth'));
require('./services/socketService')(io);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connections
    const { sequelize } = require('./database/connection');
    sequelize.close().then(() => {
      logger.info('Database connections closed');
      process.exit(0);
    }).catch(err => {
      logger.error('Error closing database:', err);
      process.exit(1);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Process ID: ${process.pid}`);
  
  // Send ready signal to PM2
  if (process.send) {
    process.send('ready');
  }
});

module.exports = { app, io };

