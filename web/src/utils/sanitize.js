import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
};

/**
 * Validate field key format (alphanumeric + underscore only)
 */
export const validateFieldKey = (value) => {
  return /^[a-zA-Z0-9_]+$/.test(value);
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Sanitize and validate form data
 */
export const sanitizeFormData = (data) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
