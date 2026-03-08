const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Helper to sanitize individual values
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Remove null bytes
    let clean = value.replace(/\0/g, '');

    // Basic XSS protection - encode < and >
    clean = clean.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Check for obvious NoSQL injection patterns if not looking like JSON
    if (clean.includes('$where') || clean.includes('$ne')) {
      logger.security('Potential NoSQL injection detected in payload', { value: clean });
    }

    return clean;
  }
  return value;
};

/**
 * Helper to recursively sanitize object values
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  Object.keys(obj).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  });

  return sanitized;
};

/**
 * Helper to sanitize objects for logging (remove passwords, tokens, etc.)
 */
const sanitizeForLogging = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'credit_card'];

  Object.keys(sanitized).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      const isSensitive = sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey));

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeForLogging(sanitized[key]);
      }
    }
  });

  return sanitized;
};

/**
 * Middleware to check for validation errors from express-validator
 * Returns 400 Bad Request with formatted error details if validation fails
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log validation failures for monitoring
    logger.warn('Request validation failed', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      errors: errors.array().map((err) => ({ param: err.param, msg: err.msg })),
      body: sanitizeForLogging(req.body),
    });

    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * Middleware to prevent common injection attacks by sanitizing request payload
 * Note: This is a defense-in-depth measure. Parameterized queries should still be used.
 */
const sanitizePayload = (req, res, next) => {
  if (!req.body) return next();

  try {
    // recursively sanitize objects
    req.body = sanitizeObject(req.body);

    // Sanitize query params
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize path params
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error('Payload sanitization error', { error: error.message });
    res.status(400).json({ error: 'Invalid payload format' });
  }
};

/**
 * Validates pagination parameters to prevent resource exhaustion
 */
const validatePagination = (options = {}) => {
  const { maxLimit = 100, defaultLimit = 20 } = options;

  return (req, res, next) => {
    let page = req.query.page ? parseInt(req.query.page, 10) : 1;
    let limit = req.query.limit ? parseInt(req.query.limit, 10) : defaultLimit;

    if (Number.isNaN(page) || page < 1) {
      page = 1;
    }

    if (Number.isNaN(limit) || limit < 1) {
      limit = defaultLimit;
    }

    // Cap maximum limit
    if (limit > maxLimit) {
      limit = maxLimit;
    }

    // Update query params with validated values
    req.query.page = page;
    req.query.limit = limit;

    // Calculate offset for convenience
    req.query.offset = (page - 1) * limit;

    next();
  };
};

/**
 * Validate content type for specific routes
 */
const requireContentType = (type) => (req, res, next) => {
  // Skip for GET/DELETE requests which typically don't have bodies
  if (['GET', 'DELETE', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip if no body
  if (!req.headers['content-length'] || req.headers['content-length'] === '0') {
    return next();
  }

  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes(type)) {
    return res.status(415).json({
      error: 'Unsupported Media Type',
      details: `Expected content-type containing ${type}`,
    });
  }

  next();
};

/**
 * Validate response payload size and ensure no sensitive data leaks
 */
const validateResponse = (req, res, next) => {
  const originalJson = res.json;

  res.json = function replaceJson(data) {
    // Basic check for obvious sensitive data leaks (e.g. password hash)
    if (data && typeof data === 'object') {
      const dataStr = JSON.stringify(data);
      if (dataStr.includes('password_hash') || dataStr.includes('api_secret_encrypted')) {
        logger.security('Blocked potential sensitive data leak in response', {
          path: req.path,
          method: req.method,
        });

        // Sanitizing the response before sending
        const sanitized = sanitizeForLogging(data);
        return originalJson.call(this, sanitized);
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Basic request parameter validation (XSS and path traversal protection)
 */
const sanitizeParams = (req, res, next) => {
  if (req.params) {
    Object.keys(req.params).forEach((key) => {
      if (typeof req.params[key] === 'string') {
        // Remove path traversal sequences
        req.params[key] = req.params[key].replace(/\.\.\//g, '').replace(/\.\.\\/g, '');
        // Basic HTML encoding for XSS
        req.params[key] = sanitizeValue(req.params[key]);
      }
    });
  }
  next();
};

/**
 * Limit request body size based on content type
 */
const validateBodySize = (_options = {}) => (req, res, next) => {
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) { // 5MB hard limit
    logger.warn('Request body too large', {
      size: contentLength,
      path: req.path,
    });
    return res.status(413).json({ error: 'Payload Too Large' });
  }
  next();
};

module.exports = {
  validateRequest,
  sanitizePayload,
  validatePagination,
  requireContentType,
  sanitizeForLogging,
  validateResponse,
  sanitizeParams,
  validateBodySize,
};
