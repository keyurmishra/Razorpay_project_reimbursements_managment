'use strict';

const AppError = require('../utils/AppError');

/**
 * authorize
 *
 * Role-based access control (RBAC) middleware factory.
 * Must be used AFTER authenticate — it depends on req.user being set.
 *
 * @param {...string} allowedRoles - One or more roles permitted to access the route.
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   // Only CFO and APE can access this route
 *   router.get('/approvals', authenticate, authorize('CFO', 'APE'), handler);
 *
 *   // Only admins
 *   router.delete('/users/:id', authenticate, authorize('CFO'), handler);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Guard: authenticate must have run first
    if (!req.user) {
      return next(
        new AppError('Authentication required. Please log in.', 401)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
          403
        )
      );
    }

    next();
  };
};

module.exports = authorize;
