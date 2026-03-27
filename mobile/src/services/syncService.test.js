import { syncService } from './syncService';
import { getDatabase } from '../storage/database';
import { reportService, uploadService } from './api';

// Mock the database
jest.mock('../storage/database', () => ({
  getDatabase: jest.fn(),
}));

// Mock the API services
jest.mock('./api', () => ({
  reportService: {
    create: jest.fn(),
    update: jest.fn(),
  },
  uploadService: {
    uploadPhoto: jest.fn(),
    uploadAudio: jest.fn(),
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('syncService', () => {
  let mockDb;
  let originalConsoleError;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock DB
    mockDb = {
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };
    getDatabase.mockReturnValue(mockDb);

    // Suppress console.error during tests
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  describe('queueItem', () => {
    it('should insert an item into the sync_queue with status pending', async () => {
      await syncService.queueItem('report', '123', 'create', { data: 'test' });

      // check that we called the database correctly without relying on exact formatting
      expect(mockDb.runAsync).toHaveBeenCalled();
      const callArgs = mockDb.runAsync.mock.calls[0];
      expect(callArgs[0]).toContain('INSERT INTO sync_queue');
      expect(callArgs[1]).toEqual(['mock-uuid', 'report', '123', 'create', JSON.stringify({ data: 'test' })]);
    });
  });

  describe('syncAll', () => {
    it('should process pending items and mark them as completed', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 'item-1', entity_type: 'report', operation: 'create', payload: JSON.stringify({ id: 'report-1' }) }
      ]);
      reportService.create.mockResolvedValue();

      const syncedCount = await syncService.syncAll();

      expect(syncedCount).toBe(1);

      expect(mockDb.getAllAsync).toHaveBeenCalled();
      expect(mockDb.getAllAsync.mock.calls[0][0]).toContain('SELECT * FROM sync_queue WHERE status = ?');
      expect(mockDb.getAllAsync.mock.calls[0][1]).toEqual(['pending']);

      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);

      // first call to processing
      expect(mockDb.runAsync.mock.calls[0][0]).toContain('UPDATE sync_queue SET status = ? WHERE id = ?');
      expect(mockDb.runAsync.mock.calls[0][1]).toEqual(['processing', 'item-1']);

      // service creates
      expect(reportService.create).toHaveBeenCalledWith({ id: 'report-1' });

      // second call to completed. Note that the original code has two placeholders and passes ['completed', 'item-1']
      expect(mockDb.runAsync.mock.calls[1][0]).toContain('UPDATE sync_queue SET status = ?, processed_at = datetime("now") WHERE id = ?');
      expect(mockDb.runAsync.mock.calls[1][1]).toEqual(['completed', 'item-1']);
    });

    it('should increment retry_count and keep status as pending when a sync fails', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 'item-1', entity_type: 'report', operation: 'create', payload: JSON.stringify({ id: 'report-1' }), retry_count: 0 }
      ]);
      reportService.create.mockRejectedValue(new Error('Network error'));

      const syncedCount = await syncService.syncAll();

      expect(syncedCount).toBe(0); // Item wasn't synced
      expect(reportService.create).toHaveBeenCalled();

      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);

      // check error handling logic without relying on exact indentation
      const errorCall = mockDb.runAsync.mock.calls[1];
      expect(errorCall[0]).toContain('UPDATE sync_queue');
      expect(errorCall[0]).toContain('SET status = ?, retry_count = ?, error_message = ?');
      expect(errorCall[0]).toContain('WHERE id = ?');

      expect(errorCall[1]).toEqual(['pending', 1, 'Network error', 'item-1']);
    });

    it('should mark item as failed when retry_count reaches 3', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 'item-1', entity_type: 'report', operation: 'create', payload: JSON.stringify({ id: 'report-1' }), retry_count: 2 }
      ]);
      reportService.create.mockRejectedValue(new Error('Network error'));

      const syncedCount = await syncService.syncAll();

      expect(syncedCount).toBe(0);

      const errorCall = mockDb.runAsync.mock.calls[1];
      expect(errorCall[0]).toContain('UPDATE sync_queue');
      expect(errorCall[1]).toEqual(['failed', 3, 'Network error', 'item-1']);
    });

    it('should handle undefined retry_count safely', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 'item-1', entity_type: 'report', operation: 'create', payload: JSON.stringify({ id: 'report-1' }) } // no retry_count
      ]);
      reportService.create.mockRejectedValue(new Error('Network error'));

      const syncedCount = await syncService.syncAll();

      expect(syncedCount).toBe(0);

      const errorCall = mockDb.runAsync.mock.calls[1];
      expect(errorCall[0]).toContain('UPDATE sync_queue');
      expect(errorCall[1]).toEqual(['pending', 1, 'Network error', 'item-1']);
    });
  });
});
