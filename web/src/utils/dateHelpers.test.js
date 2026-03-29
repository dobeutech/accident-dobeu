import { formatDate, formatDateTime, isValidDate } from './dateHelpers';
import * as dateFns from 'date-fns';

jest.mock('date-fns', () => {
  const original = jest.requireActual('date-fns');
  return {
    __esModule: true,
    ...original,
    format: jest.fn(original.format),
    parseISO: jest.fn(original.parseISO),
    isValid: jest.fn(original.isValid),
  };
});

describe('dateHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatDate', () => {
    it('returns "N/A" for falsy values', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
      expect(formatDate('')).toBe('N/A');
    });

    it('formats a valid date string correctly', () => {
      const dateString = '2023-10-15T14:30:00Z';
      // We expect the result to be formatted using the default format 'MMM dd, yyyy'
      const result = formatDate(dateString);
      // Because timezone might vary, we just check that dateFns.format was called correctly
      expect(dateFns.parseISO).toHaveBeenCalledWith(dateString);
      expect(dateFns.format).toHaveBeenCalled();
      // The result should contain the year
      expect(result).toMatch(/2023/);
    });

    it('formats a valid Date object correctly', () => {
      const date = new Date('2023-10-15T14:30:00Z');
      const result = formatDate(date);
      expect(dateFns.parseISO).not.toHaveBeenCalled();
      expect(dateFns.format).toHaveBeenCalledWith(date, 'MMM dd, yyyy');
      expect(result).toMatch(/2023/);
    });

    it('returns "Invalid Date" when parsed date is invalid', () => {
      // e.g. a string that cannot be parsed
      const result = formatDate('invalid-date-string');
      expect(result).toBe('Invalid Date');
    });

    it('returns "Invalid Date" for an invalid type (number, object)', () => {
      expect(formatDate(1234567890)).toBe('Invalid Date');
      expect(formatDate({ a: 1 })).toBe('Invalid Date');
      expect(formatDate([])).toBe('Invalid Date');
    });

    it('uses a custom format string', () => {
      const dateString = '2023-10-15T14:30:00Z';
      const result = formatDate(dateString, 'yyyy/MM/dd');
      expect(dateFns.format).toHaveBeenCalledWith(expect.any(Date), 'yyyy/MM/dd');
    });

    it('returns "Invalid Date" if an error is thrown during formatting', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Force format to throw an error
      dateFns.format.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const result = formatDate('2023-10-15T14:30:00Z');
      expect(result).toBe('Invalid Date');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Date formatting error:',
        expect.any(Error),
        'Input:',
        '2023-10-15T14:30:00Z'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('formatDateTime', () => {
    it('formats a valid date string with the correct datetime format', () => {
      const dateString = '2023-10-15T14:30:00Z';
      const result = formatDateTime(dateString);
      expect(dateFns.format).toHaveBeenCalledWith(expect.any(Date), 'MMM dd, yyyy HH:mm');
    });

    it('returns "N/A" for falsy values', () => {
      expect(formatDateTime(null)).toBe('N/A');
    });
  });

  describe('isValidDate', () => {
    it('returns false for falsy values', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    it('returns true for a valid date string', () => {
      expect(isValidDate('2023-10-15T14:30:00Z')).toBe(true);
      expect(dateFns.parseISO).toHaveBeenCalledWith('2023-10-15T14:30:00Z');
      expect(dateFns.isValid).toHaveBeenCalledWith(expect.any(Date));
    });

    it('returns true for a valid Date object', () => {
      const date = new Date('2023-10-15T14:30:00Z');
      expect(isValidDate(date)).toBe(true);
      expect(dateFns.parseISO).not.toHaveBeenCalled();
      expect(dateFns.isValid).toHaveBeenCalledWith(date);
    });

    it('returns false for an invalid date string', () => {
      expect(isValidDate('invalid-date')).toBe(false);
    });

    it('returns false if parseISO throws an error', () => {
      dateFns.parseISO.mockImplementationOnce(() => {
        throw new Error('Parse error');
      });
      expect(isValidDate('2023-10-15T14:30:00Z')).toBe(false);
    });
  });
});
