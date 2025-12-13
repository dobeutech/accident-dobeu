require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST']
  }
});

// Trust proxy for rate limiting behind load balancers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting with different tiers
const standardLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts' } },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', standardLimiter);
app.use('/api/auth/login', authLimiter);

// Request logging with request ID
app.use((req, res, next) => {
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  
  logger.info(`${req.method} ${req.path}`, { 
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent')?.substring(0, 100),
  });
  
  // Log response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path}`, {
        requestId: req.requestId,
        duration: `${duration}ms`,
        status: res.statusCode,
      });
    }
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'FleetGuard API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/fleets', require('./routes/fleets'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/form-configs', require('./routes/formConfigs'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/rmis', require('./routes/rmis'));
app.use('/api/admin', require('./routes/admin'));

// Socket.IO for real-time features
io.use(require('./middleware/socketAuth'));
require('./services/socketService')(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use(notFoundHandler);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = { app, io };

