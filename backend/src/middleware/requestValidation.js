const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware to handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errorDetails,
      ip: req.ip
    });

    return res.status(400).json({
      error: 'Validation failed',
      details: errorDetails
    });
  }

  next();
};

/**
 * Validate request body size
 */
const validateBodySize = (maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSize) {
      logger.security('Request body too large', {
        path: req.path,
        contentLength,
        maxSize,
        ip: req.ip
      });
      
      return res.status(413).json({
        error: 'Request body too large',
        maxSize: `${maxSize / 1024 / 1024}MB`
      });
    }
    
    next();
  };
};

/**
 * Validate content type
 */
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    // Skip for GET requests
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const contentType = req.get('content-type');
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type header required'
      });
    }

    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowed) {
      logger.security('Invalid content type', {
        path: req.path,
        contentType,
        allowedTypes,
        ip: req.ip
      });

      return res.status(415).json({
        error: 'Unsupported Media Type',
        allowedTypes
      });
    }

    next();
  };
};

/**
 * Sanitize request parameters
 */
const sanitizeParams = (req, res, next) => {
  // Remove null bytes from all string parameters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

/**
 * Validate UUID parameters
 */
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      return res.status(400).json({
        error: 'Invalid UUID format',
        parameter: paramName
      });
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  if (page < 1) {
    return res.status(400).json({
      error: 'Page must be greater than 0'
    });
  }

  if (limit < 1 || limit > 200) {
    return res.status(400).json({
      error: 'Limit must be between 1 and 200'
    });
  }

  req.pagination = { page, limit, offset: (page - 1) * limit };
  next();
};

/**
 * Validate date range parameters
 */
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      error: 'Invalid startDate format. Use ISO 8601 format.'
    });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({
      error: 'Invalid endDate format. Use ISO 8601 format.'
    });
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({
      error: 'startDate must be before endDate'
    });
  }

  next();
};

/**
 * Response validation middleware
 */
const validateResponse = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Ensure response has consistent structure
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Add metadata if not present
      if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
      }
    }

    // Remove sensitive fields from response
    const sanitizeResponse = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeResponse);
      }
      if (obj && typeof obj === 'object') {
        const sanitized = { ...obj };
        delete sanitized.password_hash;
        delete sanitized.password;
        delete sanitized.secret;
        delete sanitized.token;
        
        for (const key in sanitized) {
          sanitized[key] = sanitizeResponse(sanitized[key]);
        }
        return sanitized;
      }
      return obj;
    };

    const sanitizedData = sanitizeResponse(data);
    return originalJson.call(this, sanitizedData);
  };

  next();
};

module.exports = {
  handleValidationErrors,
  validateBodySize,
  validateContentType,
  sanitizeParams,
  validateUUID,
  validatePagination,
  validateDateRange,
  validateResponse
};
