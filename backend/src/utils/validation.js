/**
 * FleetGuard Backend Validation Utilities
 * Provides input validation with multi-language error messages
 */

const { ValidationError } = require('../middleware/errorHandler');

// Validation error messages by language
const validationMessages = {
  en: {
    required: (field) => `${field} is required`,
    email: 'Please enter a valid email address',
    minLength: (field, min) => `${field} must be at least ${min} characters`,
    maxLength: (field, max) => `${field} must be no more than ${max} characters`,
    passwordStrength: 'Password must contain at least 8 characters, one uppercase, one lowercase, and one number',
    uuid: (field) => `${field} must be a valid UUID`,
    phone: 'Please enter a valid phone number',
    date: (field) => `${field} must be a valid date`,
    number: (field) => `${field} must be a number`,
    integer: (field) => `${field} must be a whole number`,
    positive: (field) => `${field} must be a positive number`,
    range: (field, min, max) => `${field} must be between ${min} and ${max}`,
    oneOf: (field, options) => `${field} must be one of: ${options.join(', ')}`,
    url: (field) => `${field} must be a valid URL`,
    latitude: 'Latitude must be between -90 and 90',
    longitude: 'Longitude must be between -180 and 180',
    fileType: (allowed) => `File type must be one of: ${allowed.join(', ')}`,
    fileSize: (max) => `File size must be less than ${max}MB`,
    arrayMinLength: (field, min) => `${field} must have at least ${min} item(s)`,
    arrayMaxLength: (field, max) => `${field} must have no more than ${max} item(s)`,
  },
  es: {
    required: (field) => `${field} es obligatorio`,
    email: 'Por favor ingrese un correo electrónico válido',
    minLength: (field, min) => `${field} debe tener al menos ${min} caracteres`,
    maxLength: (field, max) => `${field} no debe exceder ${max} caracteres`,
    passwordStrength: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
    uuid: (field) => `${field} debe ser un UUID válido`,
    phone: 'Por favor ingrese un número de teléfono válido',
    date: (field) => `${field} debe ser una fecha válida`,
    number: (field) => `${field} debe ser un número`,
    integer: (field) => `${field} debe ser un número entero`,
    positive: (field) => `${field} debe ser un número positivo`,
    range: (field, min, max) => `${field} debe estar entre ${min} y ${max}`,
    oneOf: (field, options) => `${field} debe ser uno de: ${options.join(', ')}`,
    url: (field) => `${field} debe ser una URL válida`,
    latitude: 'La latitud debe estar entre -90 y 90',
    longitude: 'La longitud debe estar entre -180 y 180',
    fileType: (allowed) => `El tipo de archivo debe ser uno de: ${allowed.join(', ')}`,
    fileSize: (max) => `El archivo debe ser menor a ${max}MB`,
    arrayMinLength: (field, min) => `${field} debe tener al menos ${min} elemento(s)`,
    arrayMaxLength: (field, max) => `${field} no debe tener más de ${max} elemento(s)`,
  },
  fr: {
    required: (field) => `${field} est requis`,
    email: 'Veuillez entrer une adresse email valide',
    minLength: (field, min) => `${field} doit contenir au moins ${min} caractères`,
    maxLength: (field, max) => `${field} ne doit pas dépasser ${max} caractères`,
    passwordStrength: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
    uuid: (field) => `${field} doit être un UUID valide`,
    phone: 'Veuillez entrer un numéro de téléphone valide',
    date: (field) => `${field} doit être une date valide`,
    number: (field) => `${field} doit être un nombre`,
    integer: (field) => `${field} doit être un nombre entier`,
    positive: (field) => `${field} doit être un nombre positif`,
    range: (field, min, max) => `${field} doit être entre ${min} et ${max}`,
    oneOf: (field, options) => `${field} doit être l'un des: ${options.join(', ')}`,
    url: (field) => `${field} doit être une URL valide`,
    latitude: 'La latitude doit être entre -90 et 90',
    longitude: 'La longitude doit être entre -180 et 180',
    fileType: (allowed) => `Le type de fichier doit être l'un des: ${allowed.join(', ')}`,
    fileSize: (max) => `La taille du fichier doit être inférieure à ${max}Mo`,
    arrayMinLength: (field, min) => `${field} doit avoir au moins ${min} élément(s)`,
    arrayMaxLength: (field, max) => `${field} ne doit pas avoir plus de ${max} élément(s)`,
  },
};

/**
 * Validator class for chaining validations
 */
class Validator {
  constructor(data, language = 'en') {
    this.data = data;
    this.language = ['en', 'es', 'fr'].includes(language) ? language : 'en';
    this.errors = [];
    this.currentField = null;
    this.currentValue = null;
    this.currentLabel = null;
    this.skip = false;
  }

  /**
   * Get localized message
   */
  getMessage(key, ...args) {
    const messages = validationMessages[this.language];
    const fn = messages[key];
    return typeof fn === 'function' ? fn(...args) : fn;
  }

  /**
   * Set current field to validate
   */
  field(fieldName, label = null) {
    this.currentField = fieldName;
    this.currentValue = this.getNestedValue(this.data, fieldName);
    this.currentLabel = label || this.formatFieldName(fieldName);
    this.skip = false;
    return this;
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  /**
   * Format field name for display
   */
  formatFieldName(fieldName) {
    return fieldName
      .split('.')
      .pop()
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  /**
   * Add error
   */
  addError(message) {
    if (!this.skip) {
      this.errors.push({
        field: this.currentField,
        message,
      });
    }
    return this;
  }

  /**
   * Make field optional - skip remaining validations if empty
   */
  optional() {
    if (this.currentValue === undefined || this.currentValue === null || this.currentValue === '') {
      this.skip = true;
    }
    return this;
  }

  /**
   * Required validation
   */
  required() {
    if (this.currentValue === undefined || this.currentValue === null || this.currentValue === '') {
      this.addError(this.getMessage('required', this.currentLabel));
    }
    return this;
  }

  /**
   * Email validation
   */
  email() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.currentValue && !emailRegex.test(this.currentValue)) {
      this.addError(this.getMessage('email'));
    }
    return this;
  }

  /**
   * Minimum length validation
   */
  minLength(min) {
    if (this.currentValue && String(this.currentValue).length < min) {
      this.addError(this.getMessage('minLength', this.currentLabel, min));
    }
    return this;
  }

  /**
   * Maximum length validation
   */
  maxLength(max) {
    if (this.currentValue && String(this.currentValue).length > max) {
      this.addError(this.getMessage('maxLength', this.currentLabel, max));
    }
    return this;
  }

  /**
   * Password strength validation
   */
  password() {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (this.currentValue && !passwordRegex.test(this.currentValue)) {
      this.addError(this.getMessage('passwordStrength'));
    }
    return this;
  }

  /**
   * UUID validation
   */
  uuid() {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (this.currentValue && !uuidRegex.test(this.currentValue)) {
      this.addError(this.getMessage('uuid', this.currentLabel));
    }
    return this;
  }

  /**
   * Phone number validation
   */
  phone() {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (this.currentValue && !phoneRegex.test(this.currentValue.replace(/\s/g, ''))) {
      this.addError(this.getMessage('phone'));
    }
    return this;
  }

  /**
   * Date validation
   */
  date() {
    if (this.currentValue && isNaN(Date.parse(this.currentValue))) {
      this.addError(this.getMessage('date', this.currentLabel));
    }
    return this;
  }

  /**
   * Number validation
   */
  number() {
    if (this.currentValue !== undefined && this.currentValue !== null && isNaN(Number(this.currentValue))) {
      this.addError(this.getMessage('number', this.currentLabel));
    }
    return this;
  }

  /**
   * Integer validation
   */
  integer() {
    if (this.currentValue && !Number.isInteger(Number(this.currentValue))) {
      this.addError(this.getMessage('integer', this.currentLabel));
    }
    return this;
  }

  /**
   * Positive number validation
   */
  positive() {
    if (this.currentValue !== undefined && Number(this.currentValue) <= 0) {
      this.addError(this.getMessage('positive', this.currentLabel));
    }
    return this;
  }

  /**
   * Range validation
   */
  range(min, max) {
    const num = Number(this.currentValue);
    if (this.currentValue && (num < min || num > max)) {
      this.addError(this.getMessage('range', this.currentLabel, min, max));
    }
    return this;
  }

  /**
   * Enum validation
   */
  oneOf(options) {
    if (this.currentValue && !options.includes(this.currentValue)) {
      this.addError(this.getMessage('oneOf', this.currentLabel, options));
    }
    return this;
  }

  /**
   * URL validation
   */
  url() {
    try {
      if (this.currentValue) {
        new URL(this.currentValue);
      }
    } catch {
      this.addError(this.getMessage('url', this.currentLabel));
    }
    return this;
  }

  /**
   * Latitude validation
   */
  latitude() {
    const lat = Number(this.currentValue);
    if (this.currentValue && (isNaN(lat) || lat < -90 || lat > 90)) {
      this.addError(this.getMessage('latitude'));
    }
    return this;
  }

  /**
   * Longitude validation
   */
  longitude() {
    const lon = Number(this.currentValue);
    if (this.currentValue && (isNaN(lon) || lon < -180 || lon > 180)) {
      this.addError(this.getMessage('longitude'));
    }
    return this;
  }

  /**
   * Array minimum length
   */
  arrayMinLength(min) {
    if (Array.isArray(this.currentValue) && this.currentValue.length < min) {
      this.addError(this.getMessage('arrayMinLength', this.currentLabel, min));
    }
    return this;
  }

  /**
   * Array maximum length
   */
  arrayMaxLength(max) {
    if (Array.isArray(this.currentValue) && this.currentValue.length > max) {
      this.addError(this.getMessage('arrayMaxLength', this.currentLabel, max));
    }
    return this;
  }

  /**
   * Custom validation
   */
  custom(fn, message) {
    if (this.currentValue && !fn(this.currentValue)) {
      this.addError(message);
    }
    return this;
  }

  /**
   * Check if validation passed
   */
  isValid() {
    return this.errors.length === 0;
  }

  /**
   * Get errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Throw ValidationError if invalid
   */
  validate() {
    if (!this.isValid()) {
      throw new ValidationError('Validation failed', this.errors);
    }
    return true;
  }
}

/**
 * Create validator for request
 */
function createValidator(req) {
  const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
                   req.user?.preferredLanguage ||
                   'en';
  return new Validator(req.body, language);
}

/**
 * Validate request with schema-like object
 */
function validateRequest(req, schema) {
  const validator = createValidator(req);
  
  for (const [fieldName, rules] of Object.entries(schema)) {
    const fieldValidator = validator.field(fieldName, rules.label);
    
    if (rules.optional) {
      fieldValidator.optional();
    }
    
    if (rules.required) {
      fieldValidator.required();
    }
    
    if (rules.email) {
      fieldValidator.email();
    }
    
    if (rules.password) {
      fieldValidator.password();
    }
    
    if (rules.minLength) {
      fieldValidator.minLength(rules.minLength);
    }
    
    if (rules.maxLength) {
      fieldValidator.maxLength(rules.maxLength);
    }
    
    if (rules.uuid) {
      fieldValidator.uuid();
    }
    
    if (rules.phone) {
      fieldValidator.phone();
    }
    
    if (rules.date) {
      fieldValidator.date();
    }
    
    if (rules.number) {
      fieldValidator.number();
    }
    
    if (rules.integer) {
      fieldValidator.integer();
    }
    
    if (rules.positive) {
      fieldValidator.positive();
    }
    
    if (rules.range) {
      fieldValidator.range(rules.range[0], rules.range[1]);
    }
    
    if (rules.oneOf) {
      fieldValidator.oneOf(rules.oneOf);
    }
    
    if (rules.url) {
      fieldValidator.url();
    }
    
    if (rules.latitude) {
      fieldValidator.latitude();
    }
    
    if (rules.longitude) {
      fieldValidator.longitude();
    }
  }
  
  validator.validate();
  return true;
}

module.exports = {
  Validator,
  createValidator,
  validateRequest,
};
