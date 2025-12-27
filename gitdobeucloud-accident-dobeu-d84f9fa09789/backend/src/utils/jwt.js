const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || process.env.SESSION_SECRET;

const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  generateToken,
  verifyToken
};

