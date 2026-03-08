// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long';
process.env.SESSION_SECRET = 'test-session-secret-key-minimum-32-characters-long';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock logger to reduce noise in tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  security: jest.fn(),
  performance: jest.fn()
}));

// Global test utilities
global.testUtils = {
  generateMockToken: () => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'fleet_admin',
        fleet_id: 'test-fleet-id'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
};
