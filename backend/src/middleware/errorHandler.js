/**
 * FleetGuard Backend Error Handler Middleware
 * Provides standardized error responses with i18n support
 */

const logger = require('../utils/logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, code = 'UNKNOWN_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Error message translations
const errorMessages = {
  en: {
    VALIDATION_ERROR: 'Validation failed',
    AUTHENTICATION_ERROR: 'Authentication required',
    AUTHORIZATION_ERROR: 'Access denied',
    NOT_FOUND: 'Resource not found',
    CONFLICT: 'Resource already exists',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
    INTERNAL_ERROR: 'An unexpected error occurred',
    DATABASE_ERROR: 'Database operation failed',
    FILE_UPLOAD_ERROR: 'File upload failed',
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Session expired, please log in again',
    INVALID_TOKEN: 'Invalid authentication token',
    PASSWORD_TOO_WEAK: 'Password does not meet requirements',
    EMAIL_EXISTS: 'An account with this email already exists',
    INVALID_FILE_TYPE: 'Invalid file type',
    FILE_TOO_LARGE: 'File exceeds maximum size limit',
    REPORT_NOT_FOUND: 'Report not found',
    FLEET_NOT_FOUND: 'Fleet not found',
    USER_NOT_FOUND: 'User not found',
    INTEGRATION_ERROR: 'RMIS integration failed',
  },
  es: {
    VALIDATION_ERROR: 'Error de validación',
    AUTHENTICATION_ERROR: 'Se requiere autenticación',
    AUTHORIZATION_ERROR: 'Acceso denegado',
    NOT_FOUND: 'Recurso no encontrado',
    CONFLICT: 'El recurso ya existe',
    RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes, intente más tarde',
    INTERNAL_ERROR: 'Ocurrió un error inesperado',
    DATABASE_ERROR: 'Error en la operación de base de datos',
    FILE_UPLOAD_ERROR: 'Error al subir archivo',
    INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
    TOKEN_EXPIRED: 'Sesión expirada, por favor inicie sesión nuevamente',
    INVALID_TOKEN: 'Token de autenticación inválido',
    PASSWORD_TOO_WEAK: 'La contraseña no cumple los requisitos',
    EMAIL_EXISTS: 'Ya existe una cuenta con este correo',
    INVALID_FILE_TYPE: 'Tipo de archivo inválido',
    FILE_TOO_LARGE: 'El archivo excede el tamaño máximo permitido',
    REPORT_NOT_FOUND: 'Reporte no encontrado',
    FLEET_NOT_FOUND: 'Flota no encontrada',
    USER_NOT_FOUND: 'Usuario no encontrado',
    INTEGRATION_ERROR: 'Error en la integración RMIS',
  },
  fr: {
    VALIDATION_ERROR: 'Échec de validation',
    AUTHENTICATION_ERROR: 'Authentification requise',
    AUTHORIZATION_ERROR: 'Accès refusé',
    NOT_FOUND: 'Ressource non trouvée',
    CONFLICT: 'La ressource existe déjà',
    RATE_LIMIT_EXCEEDED: 'Trop de requêtes, veuillez réessayer plus tard',
    INTERNAL_ERROR: 'Une erreur inattendue s\'est produite',
    DATABASE_ERROR: 'Échec de l\'opération de base de données',
    FILE_UPLOAD_ERROR: 'Échec du téléchargement du fichier',
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
    TOKEN_EXPIRED: 'Session expirée, veuillez vous reconnecter',
    INVALID_TOKEN: 'Jeton d\'authentification invalide',
    PASSWORD_TOO_WEAK: 'Le mot de passe ne répond pas aux exigences',
    EMAIL_EXISTS: 'Un compte avec cet email existe déjà',
    INVALID_FILE_TYPE: 'Type de fichier invalide',
    FILE_TOO_LARGE: 'Le fichier dépasse la taille maximale autorisée',
    REPORT_NOT_FOUND: 'Rapport non trouvé',
    FLEET_NOT_FOUND: 'Flotte non trouvée',
    USER_NOT_FOUND: 'Utilisateur non trouvé',
    INTEGRATION_ERROR: 'Échec de l\'intégration RMIS',
  },
};

/**
 * Get error message in requested language
 */
function getLocalizedMessage(code, language = 'en') {
  const lang = ['en', 'es', 'fr'].includes(language) ? language : 'en';
  return errorMessages[lang][code] || errorMessages.en[code] || errorMessages.en.INTERNAL_ERROR;
}

/**
 * Main error handler middleware
 */
function errorHandler(err, req, res, _next) {
  // Get language from request header or user preference
  const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
                   req.user?.preferredLanguage || 
                   'en';

  // Log the error
  if (err.isOperational) {
    logger.warn('Operational error:', {
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    });
  } else {
    logger.error('Unexpected error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    });
  }

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: getLocalizedMessage('INVALID_TOKEN', language),
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: getLocalizedMessage('TOKEN_EXPIRED', language),
      },
    });
  }

  // Handle Postgres unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: getLocalizedMessage('CONFLICT', language),
      },
    });
  }

  // Handle Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: getLocalizedMessage('VALIDATION_ERROR', language),
      },
    });
  }

  // Handle Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: getLocalizedMessage('FILE_TOO_LARGE', language),
      },
    });
  }

  // Handle custom operational errors
  if (err.isOperational) {
    const response = {
      success: false,
      error: {
        code: err.code,
        message: getLocalizedMessage(err.code, language) || err.message,
      },
    };

    // Include validation errors if present
    if (err.errors && err.errors.length > 0) {
      response.error.details = err.errors;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle unexpected errors
  const statusCode = err.status || err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: getLocalizedMessage('INTERNAL_ERROR', language),
      ...(process.env.NODE_ENV === 'development' && { 
        debug: {
          message: err.message,
          stack: err.stack,
        }
      }),
    },
  });
}

/**
 * Async handler wrapper to catch errors in async routes
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
  
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: getLocalizedMessage('NOT_FOUND', language),
      path: req.path,
    },
  });
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  getLocalizedMessage,
};
