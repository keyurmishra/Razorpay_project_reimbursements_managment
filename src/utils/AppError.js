'use strict';

/**
 * AppError
 * A custom error class that carries an HTTP status code.
 * Use this to throw operational errors that should be handled gracefully.
 *
 * @example
 *   throw new AppError('User not found', 404);
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
