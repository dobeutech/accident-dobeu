const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Store for tracking failed login attempts
const loginAttempts = new Map();

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    logger.security('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many requests, please try again later.'
    });
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.',
  handler: (req, res) => {
    logger.security('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
      path: req.path
    });
    res.status(429).json({
      error: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }
});

// Account lockout after failed attempts
const accountLockout = (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    return next();
  }

  const key = `${email}:${req.ip}`;
  const attempts = loginAttempts.get(key) || { count: 0, lockedUntil: null };

  // Check if account is locked
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
    logger.security('Account locked', { email, ip: req.ip, remainingTime });
    return res.status(423).json({
      error: `Account temporarily locked. Try again in ${remainingTime} minutes.`
    });
  }

  // Reset if lockout expired
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    loginAttempts.delete(key);
  }

  next();
};

// Track failed login attempts
const trackFailedLogin = (email, ip) => {
  const key = `${email}:${ip}`;
  const attempts = loginAttempts.get(key) || { count: 0, lockedUntil: null };
  
  attempts.count += 1;
  
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const lockoutDuration = parseInt(process.env.LOCKOUT_DURATION) || 15 * 60 * 1000;
  
  if (attempts.count >= maxAttempts) {
    attempts.lockedUntil = Date.now() + lockoutDuration;
    logger.security('Account locked due to failed attempts', {
      email,
      ip,
      attempts: attempts.count
    });
  }
  
  loginAttempts.set(key, attempts);
  
  // Clean up old entries after 1 hour
  setTimeout(() => {
    if (loginAttempts.has(key)) {
      const current = loginAttempts.get(key);
      if (!current.lockedUntil || Date.now() >= current.lockedUntil) {
        loginAttempts.delete(key);
      }
    }
  }, 60 * 60 * 1000);
};

// Reset failed attempts on successful login
const resetFailedAttempts = (email, ip) => {
  const key = `${email}:${ip}`;
  loginAttempts.delete(key);
};

// Slow down requests after threshold
const slowDown = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  delayAfter: 25,
  delayMs: 500,
  skipSuccessfulRequests: false
});

// IP whitelist middleware
const ipWhitelist = (req, res, next) => {
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];
  
  if (whitelist.length === 0) {
    return next();
  }
  
  const clientIp = req.ip || req.connection.remoteAddress;
  
  if (whitelist.includes(clientIp)) {
    return next();
  }
  
  // Check if IP is in whitelist range (basic CIDR support)
  const isWhitelisted = whitelist.some(ip => {
    if (ip.includes('/')) {
      // CIDR notation - simplified check
      const [network] = ip.split('/');
      return clientIp.startsWith(network.split('.').slice(0, 3).join('.'));
    }
    return ip === clientIp;
  });
  
  if (isWhitelisted) {
    return next();
  }
  
  logger.security('IP not whitelisted', { ip: clientIp, path: req.path });
  res.status(403).json({ error: 'Access denied' });
};

module.exports = {
  apiLimiter,
  authLimiter,
  accountLockout,
  trackFailedLogin,
  resetFailedAttempts,
  slowDown,
  ipWhitelist
};
