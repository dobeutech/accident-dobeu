const request = require('supertest');
const { app } = require('../server');
const { sequelize } = require('../database/connection');

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.query = jest.fn();
  });
  // No real DB connection needed

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
      sequelize.query.mockResolvedValueOnce([[]]); // No user found
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should enforce rate limiting after multiple failed attempts', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      sequelize.query.mockResolvedValue([[]]); // Always fail login
      // Make 6 failed attempts (limit is 5)
      await Promise.all(
        Array.from({ length: 6 }).map(() => request(app)
          .post('/api/auth/login')
          .send(credentials)),
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
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
