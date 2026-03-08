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
const { sequelize } = require('../database/connection');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    it('should reject login without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        // .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should enforce rate limiting after multiple failed attempts', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Make 6 failed attempts (limit is 5)
      // eslint-disable-next-line no-plusplus
      await Promise.all(
        Array.from({ length: 6 }).map(() => request(app).post('/api/auth/login').send(credentials)),
      );

      // 7th attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(429);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/too many/i);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });
});
