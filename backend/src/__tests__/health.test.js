jest.mock('../database/connection', () => ({
  sequelize: {
    query: jest.fn().mockResolvedValue([[]]),
    QueryTypes: { SELECT: 'SELECT', INSERT: 'INSERT', UPDATE: 'UPDATE' },
    authenticate: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue(),
  },
}));
/* eslint-disable radix, max-len, no-unused-vars, no-restricted-syntax, no-await-in-loop, no-return-await, global-require, no-plusplus, no-restricted-globals, guard-for-in */
const request = require('supertest');
const { app } = require('../server');

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 and basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.checks).toHaveProperty('cpu');
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 when system is ready', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ready');
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 when system is alive', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
    });
  });

  describe('GET /health/metrics', () => {
    it('should return system metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('performance');
      expect(response.body).toHaveProperty('process');
      expect(response.body).toHaveProperty('system');
    });
  });
});
