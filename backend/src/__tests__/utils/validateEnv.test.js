const { validateS3 } = require('../../utils/validateEnv');
const logger = require('../../utils/logger');
const AWS = require('aws-sdk');

jest.mock('aws-sdk');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('validateEnv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateS3', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should skip validation if not in production and AWS_S3_BUCKET is not set', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.AWS_S3_BUCKET;

      const result = await validateS3();

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Skipping S3 validation (not configured)');
      expect(AWS.S3).not.toHaveBeenCalled();
    });

    it('should successfully validate S3 connection', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
      process.env.AWS_S3_BUCKET = 'test-bucket';

      const mockHeadBucket = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      AWS.S3.mockImplementation(() => ({
        headBucket: mockHeadBucket
      }));

      const result = await validateS3();

      expect(result).toBe(true);
      expect(AWS.S3).toHaveBeenCalledWith({
        region: 'us-east-1',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key'
      });
      expect(mockHeadBucket).toHaveBeenCalledWith({ Bucket: 'test-bucket' });
      expect(logger.info).toHaveBeenCalledWith('S3 bucket access validated');
    });

    it('should catch error, log it, and return false when headBucket rejects', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
      process.env.AWS_S3_BUCKET = 'test-bucket';

      const mockError = new Error('Access Denied');
      const mockHeadBucket = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(mockError)
      });

      AWS.S3.mockImplementation(() => ({
        headBucket: mockHeadBucket
      }));

      const result = await validateS3();

      expect(result).toBe(false);
      expect(AWS.S3).toHaveBeenCalledWith({
        region: 'us-east-1',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key'
      });
      expect(mockHeadBucket).toHaveBeenCalledWith({ Bucket: 'test-bucket' });
      expect(logger.error).toHaveBeenCalledWith('S3 validation failed:', 'Access Denied');
    });
  });
});
