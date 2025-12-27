const crypto = require('crypto');
const logger = require('../utils/logger');

const CSRF_SECRET_LENGTH = 32;
const CSRF_TOKEN_LENGTH = 32;

const generateSecret = () => {
  return crypto.randomBytes(CSRF_SECRET_LENGTH).toString('hex');
};

const generateToken = (secret) => {
  const salt = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const hash = crypto.createHmac('sha256', secret).update(salt).digest('hex');
  return `${salt}.${hash}`;
};

const validateToken = (token, secret) => {
  if (!token || !secret || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }
  
  const [salt, hash] = parts;
  const expectedHash = crypto.createHmac('sha256', secret).update(salt).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
};

const csrfProtection = (options = {}) => {
  const cookieName = options.cookieName || '_csrf_secret';
  const headerName = options.headerName || 'x-csrf-token';
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    ...options.cookie
  };

  return (req, res, next) => {
    let secret = req.cookies[cookieName];
    
    if (!secret) {
      secret = generateSecret();
      res.cookie(cookieName, secret, cookieOptions);
    }
    
    req.csrfToken = () => generateToken(secret);
    
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
      return next();
    }
    
    const token = req.headers[headerName] || req.headers[headerName.toLowerCase()];
    
    if (!token) {
      logger.warn('CSRF token missing', { path: req.path, method: req.method });
      return res.status(403).json({ error: 'CSRF token missing' });
    }
    
    try {
      if (!validateToken(token, secret)) {
        logger.warn('CSRF token invalid', { path: req.path, method: req.method });
        return res.status(403).json({ error: 'CSRF token invalid' });
      }
    } catch (error) {
      logger.error('CSRF validation error:', error);
      return res.status(403).json({ error: 'CSRF validation failed' });
    }
    
    next();
  };
};

module.exports = { csrfProtection, generateToken, validateToken };
