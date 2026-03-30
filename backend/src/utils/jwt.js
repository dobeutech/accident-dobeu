/* eslint-disable radix, max-len, no-unused-vars, no-restricted-syntax, no-await-in-loop, no-return-await, global-require, no-plusplus, no-restricted-globals, guard-for-in */
const jwt = require('jsonwebtoken');

const generateToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
});

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = {
  generateToken,
  verifyToken,
};
