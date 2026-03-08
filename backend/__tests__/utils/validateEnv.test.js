const { validateEnvironment, validateDatabase, validateS3, runStartupValidation } = require('../../src/utils/validateEnv');

// Mock child modules AFTER requiring the file
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

jest.mock('../../src/database/connection', () => ({
  sequelize: {
    authenticate: jest.fn(),
    query: jest.fn()
  }
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    headBucket: jest.fn().mockReturnValue({
      promise: jest.fn()
    })
  }))
}));

const logger = require('../../src/utils/logger');
const { sequelize } = require('../../src/database/connection');
const AWS = require('aws-sdk');

describe('validateEnv module', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {}; // Clear environment to test validation specifically
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('validateEnvironment', () => {
    it('should pass validation with all required environment variables', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpassword';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.SESSION_SECRET = 'b'.repeat(32);

      const result = validateEnvironment();

      expect(result).toBe(true);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should fail validation if a required variable is missing', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      // DB_NAME is missing
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpassword';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.SESSION_SECRET = 'b'.repeat(32);

      const result = validateEnvironment();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Environment validation failed:');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Missing required environment variable: DB_NAME'));
    });

    it('should fail if JWT_SECRET is too short', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpassword';
      process.env.JWT_SECRET = 'short'; // < 32 chars
      process.env.SESSION_SECRET = 'b'.repeat(32);

      const result = validateEnvironment();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET must be at least 32 characters long'));
    });

    it('should fail if SESSION_SECRET is too short', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpassword';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.SESSION_SECRET = 'short'; // < 32 chars

      const result = validateEnvironment();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('SESSION_SECRET must be at least 32 characters long'));
    });

    it('should fail if PORT is invalid', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = 'invalid';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpassword';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.SESSION_SECRET = 'b'.repeat(32);

      const result = validateEnvironment();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('PORT must be a valid port number (1-65535)'));
    });

    it('should fail in production if AWS variables are missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpassword';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.SESSION_SECRET = 'b'.repeat(32);
      // Missing AWS variables

      const result = validateEnvironment();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('AWS_REGION is required in production'));
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('AWS_ACCESS_KEY_ID is required in production'));
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('AWS_SECRET_ACCESS_KEY is required in production'));
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('AWS_S3_BUCKET is required in production'));
    });

    it('should log warnings for recommended variables if missing', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpassword';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.SESSION_SECRET = 'b'.repeat(32);
      // Missing LOG_LEVEL, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS

      const result = validateEnvironment();

      expect(result).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith('Environment validation warnings:');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Recommended environment variable not set: LOG_LEVEL'));
    });

    it('should apply Replit environment mappings', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      // DB_* variables missing, PG* variables present
      process.env.PGHOST = 'replithost';
      process.env.PGPORT = '5432';
      process.env.PGDATABASE = 'replitdb';
      process.env.PGUSER = 'replituser';
      process.env.PGPASSWORD = 'replitpassword';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.SESSION_SECRET = 'b'.repeat(32);

      const result = validateEnvironment();

      expect(result).toBe(true);
      expect(process.env.DB_HOST).toBe('replithost');
      expect(process.env.DB_PORT).toBe('5432');
      expect(process.env.DB_NAME).toBe('replitdb');
      expect(process.env.DB_USER).toBe('replituser');
      expect(process.env.DB_PASSWORD).toBe('replitpassword');
    });
  });

  describe('validateDatabase', () => {
    it('should pass if authentication succeeds and all tables exist', async () => {
      sequelize.authenticate.mockResolvedValue();
      sequelize.query.mockResolvedValue([
        [
          { table_name: 'fleets' },
          { table_name: 'users' },
          { table_name: 'permissions' },
          { table_name: 'accident_reports' },
          { table_name: 'fleet_form_configs' },
          { table_name: 'extra_table' }
        ]
      ]);

      const result = await validateDatabase();

      expect(result).toBe(true);
      expect(sequelize.authenticate).toHaveBeenCalled();
      expect(sequelize.query).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should fail if authentication throws an error', async () => {
      const dbError = new Error('Connection refused');
      sequelize.authenticate.mockRejectedValue(dbError);

      const result = await validateDatabase();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Database validation failed:', 'Connection refused');
    });

    it('should fail if tables are missing', async () => {
      sequelize.authenticate.mockResolvedValue();
      sequelize.query.mockResolvedValue([
        [
          { table_name: 'users' },
          { table_name: 'permissions' }
          // fleets, accident_reports, fleet_form_configs are missing
        ]
      ]);

      const result = await validateDatabase();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Missing required database tables:', ['fleets', 'accident_reports', 'fleet_form_configs']);
    });
  });

  describe('validateS3', () => {
    it('should skip validation in non-production environments if bucket is not configured', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.AWS_S3_BUCKET;

      const result = await validateS3();

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Skipping S3 validation (not configured)');
    });

    it('should pass if bucket head request succeeds', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';

      const mockPromise = jest.fn().mockResolvedValue({});
      AWS.S3.mockImplementation(() => ({
        headBucket: jest.fn().mockReturnValue({
          promise: mockPromise
        })
      }));

      const result = await validateS3();

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('S3 bucket access validated');
    });

    it('should fail if bucket head request throws an error', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';

      const s3Error = new Error('Access Denied');
      const mockPromise = jest.fn().mockRejectedValue(s3Error);
      AWS.S3.mockImplementation(() => ({
        headBucket: jest.fn().mockReturnValue({
          promise: mockPromise
        })
      }));

      const result = await validateS3();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('S3 validation failed:', 'Access Denied');
    });
  });

  describe('runStartupValidation', () => {
    let mockExit;
    // We need to temporarily hold the original functions if we were to modify them,
    // but the actual runStartupValidation uses the module directly. To intercept calls
    // within the same module, we'd normally need to mock the module, but here we can just
    // control the environment and the mocked dependencies to achieve the different branches.

    beforeEach(() => {
      mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpassword';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.SESSION_SECRET = 'b'.repeat(32);
    });

    afterEach(() => {
      mockExit.mockRestore();
    });

    it('should pass all validations and return true', async () => {
      sequelize.authenticate.mockResolvedValue();
      sequelize.query.mockResolvedValue([
        [
          { table_name: 'fleets' },
          { table_name: 'users' },
          { table_name: 'permissions' },
          { table_name: 'accident_reports' },
          { table_name: 'fleet_form_configs' }
        ]
      ]);

      const result = await runStartupValidation();

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('✓ All startup validations passed');
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should exit with code 1 if environment validation fails', async () => {
      delete process.env.PORT; // Break environment validation

      await runStartupValidation();

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(logger.error).toHaveBeenCalledWith('Startup validation failed: Invalid environment configuration');
    });

    it('should exit with code 1 if database validation fails', async () => {
      const dbError = new Error('Connection refused');
      sequelize.authenticate.mockRejectedValue(dbError);

      await runStartupValidation();

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(logger.error).toHaveBeenCalledWith('Startup validation failed: Database validation failed');
    });

    it('should exit with code 1 if S3 validation fails in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_ACCESS_KEY_ID = 'test';
      process.env.AWS_SECRET_ACCESS_KEY = 'test';
      process.env.AWS_S3_BUCKET = 'test-bucket';

      sequelize.authenticate.mockResolvedValue();
      sequelize.query.mockResolvedValue([
        [
          { table_name: 'fleets' },
          { table_name: 'users' },
          { table_name: 'permissions' },
          { table_name: 'accident_reports' },
          { table_name: 'fleet_form_configs' }
        ]
      ]);

      const s3Error = new Error('Access Denied');
      const mockPromise = jest.fn().mockRejectedValue(s3Error);
      AWS.S3.mockImplementation(() => ({
        headBucket: jest.fn().mockReturnValue({
          promise: mockPromise
        })
      }));

      await runStartupValidation();

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(logger.error).toHaveBeenCalledWith('Startup validation failed: S3 validation failed');
    });

    it('should not exit if S3 validation fails in non-production', async () => {
      process.env.NODE_ENV = 'development';
      process.env.AWS_S3_BUCKET = 'test-bucket';

      sequelize.authenticate.mockResolvedValue();
      sequelize.query.mockResolvedValue([
        [
          { table_name: 'fleets' },
          { table_name: 'users' },
          { table_name: 'permissions' },
          { table_name: 'accident_reports' },
          { table_name: 'fleet_form_configs' }
        ]
      ]);

      const s3Error = new Error('Access Denied');
      const mockPromise = jest.fn().mockRejectedValue(s3Error);
      AWS.S3.mockImplementation(() => ({
        headBucket: jest.fn().mockReturnValue({
          promise: mockPromise
        })
      }));

      const result = await runStartupValidation();

      expect(result).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });
  });
});

describe('validateEnvironment extra production warnings', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {}; // Clear environment to test validation specifically
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should log warnings for loose CORS and missing security configs in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '3000';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'testdb';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpassword';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.SESSION_SECRET = 'b'.repeat(32);
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.AWS_S3_BUCKET = 'test-bucket';
    // Loose CORS
    process.env.CORS_ORIGIN = '*';
    // Missing COOKIE_SECURE and DB_SSL

    const { validateEnvironment } = require('../../src/utils/validateEnv');
    const result = validateEnvironment();

    expect(result).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('CORS_ORIGIN should be set to specific domains in production'));
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('COOKIE_SECURE should be true in production'));
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('DB_SSL should be enabled in production'));
  });
});
