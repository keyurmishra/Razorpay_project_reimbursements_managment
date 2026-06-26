'use strict';

// ── Response helpers ──────────────────────────────────────────────────────────

const sendError = (res, statusCode, message, errors, err) => {
  const body = {
    success: false,
    status:  statusCode >= 500 ? 'error' : 'fail',
    message,
  };

  if (errors && errors.length > 0) body.errors = errors;

  if (process.env.NODE_ENV === 'development' && err) body.stack = err.stack;

  return res.status(statusCode).json(body);
};

// ── Error normalisation functions ─────────────────────────────────────────────

const handleAppError = (err) => {
  if (!err.isOperational) return null;
  return {
    statusCode: err.statusCode,
    message:    err.message,
    errors:     err.errors,
  };
};

/**
 * Handle Postgres Error Codes
 */
const handlePostgresError = (err) => {
  // postgres.js sets err.code as a string of the pg error code
  if (!err.code) return null;

  switch (err.code) {
    case '23505': // unique_violation
      return {
        statusCode: 409,
        message: 'A record with that value already exists.',
        errors: [err.detail],
      };
    case '23503': // foreign_key_violation
      return {
        statusCode: 409,
        message: 'Operation failed: a related record does not exist or is still referenced by other data.',
      };
    case '23502': // not_null_violation
      return {
        statusCode: 400,
        message: `Missing required field: ${err.column}`,
      };
    case '22P02': // invalid_text_representation (e.g. invalid enum value)
      return {
        statusCode: 400,
        message: 'Invalid data format provided.',
      };
    default:
      // Generic database error fallback for other postgres codes
      return {
        statusCode: 500,
        message: 'An unexpected database error occurred.',
      };
  }
};

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
const HANDLERS = [
  handleJwtError,
  handlePostgresError,
  handleAppError, // operational AppErrors last
];

// ── Middleware ────────────────────────────────────────────────────────────────

const errorHandler = (err, req, res, next) => {
  const statusHint = err.statusCode || '???';
  console.error(
    `[ERROR] ${req.method} ${req.originalUrl} — ${statusHint}: ${err.message}` +
    (process.env.NODE_ENV === 'development' ? `\n${err.stack}` : '')
  );

  for (const handle of HANDLERS) {
    const result = handle(err);
    if (result) {
      return sendError(res, result.statusCode, result.message, result.errors, err);
    }
  }

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
