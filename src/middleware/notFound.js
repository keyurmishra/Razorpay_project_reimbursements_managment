'use strict';

/**
 * Handles requests to routes that do not exist.
 * Returns a 404 JSON response.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = notFound;
