import { describe, it, expect } from 'vitest';
import { sanitizeFormData, sanitizeInput, validateFieldKey, validateEmail } from './sanitize';

describe('sanitizeInput', () => {
  it('returns non-string values as is', () => {
    expect(sanitizeInput(null)).toBeNull();
    expect(sanitizeInput(123)).toBe(123);
    expect(sanitizeInput(true)).toBe(true);
    expect(sanitizeInput(undefined)).toBeUndefined();
  });

  it('strips HTML tags from strings', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
    expect(sanitizeInput('<p>Hello <b>World</b></p>')).toBe('Hello World');
    expect(sanitizeInput('Safe string')).toBe('Safe string');
  });
});

describe('validateFieldKey', () => {
  it('returns true for alphanumeric and underscore only', () => {
    expect(validateFieldKey('valid_key_1')).toBe(true);
    expect(validateFieldKey('ValidKey2')).toBe(true);
  });

  it('returns false for invalid characters', () => {
    expect(validateFieldKey('invalid-key')).toBe(false);
    expect(validateFieldKey('invalid key')).toBe(false);
    expect(validateFieldKey('invalid!key')).toBe(false);
  });
});

describe('validateEmail', () => {
  it('returns true for valid email formats', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
  });

  it('returns false for invalid email formats', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test@example')).toBe(false);
  });
});

describe('sanitizeFormData', () => {
  it('returns an empty object when passed an empty object', () => {
    expect(sanitizeFormData({})).toEqual({});
  });

  it('leaves non-string values unchanged', () => {
    const data = {
      num: 123,
      bool: true,
      nil: null,
      arr: [1, 2, 3],
      obj: { a: 1 }
    };

    expect(sanitizeFormData(data)).toEqual(data);
  });

  it('sanitizes string values by removing HTML tags', () => {
    const data = {
      name: 'John <script>alert("XSS")</script>Doe',
      description: '<p>A <strong>description</strong></p>',
      safe: 'Normal text'
    };

    const expected = {
      name: 'John Doe',
      description: 'A description',
      safe: 'Normal text'
    };

    expect(sanitizeFormData(data)).toEqual(expected);
  });

  it('handles a mix of string and non-string values', () => {
    const data = {
      id: 42,
      isActive: true,
      title: '<h1>Report</h1>',
      tags: ['urgent', 'review']
    };

    const expected = {
      id: 42,
      isActive: true,
      title: 'Report',
      tags: ['urgent', 'review']
    };

    expect(sanitizeFormData(data)).toEqual(expected);
  });
});
