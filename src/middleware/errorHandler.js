'use strict';

const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
  ConnectionError,
  TimeoutError,
} = require('sequelize');

// ── Response helpers ──────────────────────────────────────────────────────────

/**
 * Build a consistent error response body.
 *
 * Shape:
 * {
 *   success : false,
 *   status  : 'fail'  | 'error',
 *   message : string,
 *   errors  : string[]   (optional — only when there are multiple field-level errors),
 *   stack   : string     (optional — development only)
 * }
 *
 * @param {object}   res        - Express response
 * @param {number}   statusCode
 * @param {string}   message    - Human-readable summary
 * @param {string[]} [errors]   - Individual field / constraint errors
 * @param {Error}    [err]      - Original error (for stack trace in dev)
 */
const sendError = (res, statusCode, message, errors, err) => {
  const body = {
    success: false,
    status:  statusCode >= 500 ? 'error' : 'fail',
    message,
  };

  if (errors && errors.length > 0) body.errors = errors;

  // Stack trace is only exposed in development to avoid leaking internals
  if (process.env.NODE_ENV === 'development' && err) body.stack = err.stack;

  return res.status(statusCode).json(body);
};

// ── Error normalisation functions ─────────────────────────────────────────────
// Each function returns { statusCode, message, errors? } or null (not matched).

/**
 * Handle custom AppError instances thrown by service / middleware layers.
 * These are intentional, operational errors (e.g. 404 Not Found, 409 Conflict).
 */
const handleAppError = (err) => {
  if (!err.isOperational) return null;
  return {
    statusCode: err.statusCode,
    message:    err.message,
    errors:     err.errors,   // field-level array from validation helpers
  };
};

/**
 * Handle Sequelize model-level ValidationError
 * (triggered by validate:{} rules on model fields).
 */
const handleSequelizeValidationError = (err) => {
  if (!(err instanceof ValidationError)) return null;
  return {
    statusCode: 400,
    message:    'Validation failed.',
    errors:     err.errors.map((e) => e.message),
  };
};

/**
 * Handle Sequelize UniqueConstraintError
 * (duplicate value violates a UNIQUE index — e.g. duplicate email).
 */
const handleUniqueConstraintError = (err) => {
  if (!(err instanceof UniqueConstraintError)) return null;

  // Extract the field name(s) that caused the conflict, if available
  const fields  = err.errors.map((e) => e.path).filter(Boolean);
  const subject = fields.length > 0 ? fields.join(', ') : 'value';

  return {
    statusCode: 409,
    message:    `A record with that ${subject} already exists.`,
    errors:     err.errors.map((e) => e.message),
  };
};

/**
 * Handle Sequelize ForeignKeyConstraintError
 * (referencing a non-existent FK, or deleting a parent that has children).
 */
const handleForeignKeyConstraintError = (err) => {
  if (!(err instanceof ForeignKeyConstraintError)) return null;
  return {
    statusCode: 409,
    message:    'Operation failed: a related record does not exist or is still referenced by other data.',
  };
};

/**
 * Handle Sequelize ConnectionError / TimeoutError
 * (database is unreachable or a query took too long).
 */
const handleDatabaseConnectivityError = (err) => {
  if (!(err instanceof ConnectionError) && !(err instanceof TimeoutError)) return null;
  return {
    statusCode: 503,
    message:    'The database is temporarily unavailable. Please try again shortly.',
  };
};

/**
 * Handle Sequelize DatabaseError (generic SQL error)
 * — catches anything Sequelize wraps that isn't caught by the more specific
 *   handlers above (e.g. type-mismatch, syntax error in a raw query).
 */
const handleGenericDatabaseError = (err) => {
  if (!(err instanceof DatabaseError)) return null;
  return {
    statusCode: 500,
    message:    'An unexpected database error occurred.',
  };
};

/**
 * Handle JWT errors thrown by jsonwebtoken.verify().
 *
 * Note: TokenExpiredError and JsonWebTokenError are already converted to
 * AppErrors by authenticate.js. These branches catch any JWT errors that
 * bypass that middleware (e.g. direct token parsing in other middleware).
 */
const handleJwtError = (err) => {
  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Your session has expired. Please log in again.' };
  }
  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid token. Please log in again.' };
  }
  if (err.name === 'NotBeforeError') {
    return { statusCode: 401, message: 'Token is not yet active.' };
  }
  return null;
};

// ── Ordered handler chain ─────────────────────────────────────────────────────
// Most specific errors first; generic 500 is the final fallback.
const HANDLERS = [
  handleJwtError,
  handleSequelizeValidationError,
  handleUniqueConstraintError,
  handleForeignKeyConstraintError,
  handleDatabaseConnectivityError,
  handleGenericDatabaseError,
  handleAppError,              // operational AppErrors last (catch-all for intentional errors)
];

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Global error handler middleware.
 *
 * Must be registered LAST in app.js — after all routes and other middleware.
 * Express identifies it as an error handler because it has four parameters (err, req, res, next).
 *
 * @type {import('express').ErrorRequestHandler}
 */
const errorHandler = (err, req, res, next) => {
  // ── Logging ──────────────────────────────────────────────────────────────────
  // Always log the full error to the server console.
  // In production, plug in a proper logger (winston / pino) here.
  const statusHint = err.statusCode || '???';
  console.error(
    `[ERROR] ${req.method} ${req.originalUrl} — ${statusHint}: ${err.message}` +
    (process.env.NODE_ENV === 'development' ? `\n${err.stack}` : '')
  );

  // ── Try each handler in order ─────────────────────────────────────────────
  for (const handle of HANDLERS) {
    const result = handle(err);
    if (result) {
      return sendError(res, result.statusCode, result.message, result.errors, err);
    }
  }

  // ── Unknown / programmer error — 500 ─────────────────────────────────────
  // Never expose internal details to the client in production.
  return sendError(
    res,
    500,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error',
    undefined,
    err
  );
};

module.exports = errorHandler;
