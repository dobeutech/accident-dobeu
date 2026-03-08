import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  validateFieldKey,
  validateEmail,
  sanitizeFormData
} from './sanitize';

describe('sanitize utilities', () => {
  describe('sanitizeInput', () => {
    it('returns the input as is if it is not a string', () => {
      expect(sanitizeInput(null)).toBeNull();
      expect(sanitizeInput(undefined)).toBeUndefined();
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(true)).toBe(true);

      const obj = { a: 1 };
      expect(sanitizeInput(obj)).toBe(obj);
    });

    it('strips HTML tags from strings', () => {
      expect(sanitizeInput('<script>alert("XSS")</script>')).toBe('');
      expect(sanitizeInput('Hello <b>World</b>!')).toBe('Hello World!');
      expect(sanitizeInput('<p>paragraph</p>')).toBe('paragraph');
      expect(sanitizeInput('<a href="https://example.com">link</a>')).toBe('link');
    });

    it('returns regular strings unchanged', () => {
      expect(sanitizeInput('Safe string')).toBe('Safe string');
      expect(sanitizeInput('12345')).toBe('12345');
    });
  });

  describe('validateFieldKey', () => {
    it('returns true for valid keys (alphanumeric + underscore only)', () => {
      expect(validateFieldKey('valid_key')).toBe(true);
      expect(validateFieldKey('validKey123')).toBe(true);
      expect(validateFieldKey('12345')).toBe(true);
      expect(validateFieldKey('_key_')).toBe(true);
    });

    it('returns false for invalid keys', () => {
      expect(validateFieldKey('invalid-key')).toBe(false);
      expect(validateFieldKey('invalid key')).toBe(false);
      expect(validateFieldKey('key!')).toBe(false);
      expect(validateFieldKey('')).toBe(false); // empty string should technically not match ^[a-zA-Z0-9_]+$
    });
  });

  describe('validateEmail', () => {
    it('returns true for valid email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(validateEmail('123@example.org')).toBe(true);
    });

    it('returns false for invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@example')).toBe(false);
      expect(validateEmail('test@example.')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('sanitizeFormData', () => {
    it('sanitizes string values in an object', () => {
      const input = {
        name: 'John <script>alert("XSS")</script>Doe',
        description: '<b>Bold</b> text',
      };
      const expected = {
        name: 'John Doe',
        description: 'Bold text',
      };
      expect(sanitizeFormData(input)).toEqual(expected);
    });

    it('leaves non-string values unchanged', () => {
      const input = {
        age: 30,
        isActive: true,
        address: null,
        tags: ['a', 'b'],
        metadata: { key: 'value' }
      };
      expect(sanitizeFormData(input)).toEqual(input);
    });

    it('handles a mix of string and non-string values', () => {
      const input = {
        id: 1,
        title: '<h1>Title</h1>',
        isActive: true
      };
      const expected = {
        id: 1,
        title: 'Title',
        isActive: true
      };
      expect(sanitizeFormData(input)).toEqual(expected);
    });

    it('handles empty objects', () => {
      expect(sanitizeFormData({})).toEqual({});
    });
  });
});
