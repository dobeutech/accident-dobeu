const { validateDatabase } = require('../../utils/validateEnv');
const logger = require('../../utils/logger');
const { sequelize } = require('../../database/connection');

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../../database/connection', () => ({
  sequelize: {
    authenticate: jest.fn(),
    query: jest.fn(),
  },
}));

describe('validateEnv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateDatabase', () => {
    it('should return false and log error when database authentication fails', async () => {
      const errorMessage = 'Connection refused';
      sequelize.authenticate.mockRejectedValueOnce(new Error(errorMessage));

      const result = await validateDatabase();

      expect(result).toBe(false);
      expect(sequelize.authenticate).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('Database validation failed:', errorMessage);
    });

    it('should return false and log error when querying tables fails', async () => {
      sequelize.authenticate.mockResolvedValueOnce();
      const errorMessage = 'Query failed';
      sequelize.query.mockRejectedValueOnce(new Error(errorMessage));

      const result = await validateDatabase();

      expect(result).toBe(false);
      expect(sequelize.authenticate).toHaveBeenCalledTimes(1);
      expect(sequelize.query).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('Database validation failed:', errorMessage);
    });

    it('should return false and log error when required tables are missing', async () => {
      sequelize.authenticate.mockResolvedValueOnce();
      // Mock returning no tables, so all required tables are missing
      sequelize.query.mockResolvedValueOnce([[]]);

      const result = await validateDatabase();

      expect(result).toBe(false);
      expect(sequelize.authenticate).toHaveBeenCalledTimes(1);
      expect(sequelize.query).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Missing required database tables:',
        ['fleets', 'users', 'permissions', 'accident_reports', 'fleet_form_configs'],
      );
      expect(logger.error).toHaveBeenCalledWith('Please run database migrations: npm run migrate');
    });

    it('should return true when database is valid and all required tables exist', async () => {
      sequelize.authenticate.mockResolvedValueOnce();
      sequelize.query.mockResolvedValueOnce([[
        { table_name: 'fleets' },
        { table_name: 'users' },
        { table_name: 'permissions' },
        { table_name: 'accident_reports' },
        { table_name: 'fleet_form_configs' },
      ]]);

      const result = await validateDatabase();

      expect(result).toBe(true);
      expect(sequelize.authenticate).toHaveBeenCalledTimes(1);
      expect(sequelize.query).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Database connection validated');
      expect(logger.info).toHaveBeenCalledWith('Database schema validated');
    });
  });
});
