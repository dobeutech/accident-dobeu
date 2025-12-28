import { format, isValid, parseISO } from 'date-fns';

/**
 * Safely format a date string
 * @param {string|Date} dateString - Date to format
 * @param {string} formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date or fallback text
 */
export const formatDate = (dateString, formatStr = 'MMM dd, yyyy') => {
  if (!dateString) return 'N/A';
  
  try {
    let date;
    
    if (typeof dateString === 'string') {
      date = parseISO(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'Invalid Date';
    }
    
    if (!isValid(date)) {
      return 'Invalid Date';
    }
    
    return format(date, formatStr);
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', dateString);
    return 'Invalid Date';
  }
};

/**
 * Safely format a datetime string
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted datetime or fallback text
 */
export const formatDateTime = (dateString) => {
  return formatDate(dateString, 'MMM dd, yyyy HH:mm');
};

/**
 * Check if a date string is valid
 * @param {string|Date} dateString - Date to validate
 * @returns {boolean} True if valid
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date);
  } catch {
    return false;
  }
};
