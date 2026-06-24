'use strict';

/**
 * asyncHandler
 * Wraps an async route handler to automatically pass errors to Express's
 * next() error handler, eliminating repetitive try/catch blocks.
 *
 * @param {Function} fn - An async Express route handler
 * @returns {Function} Express middleware
 *
 * @example
 *   router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await UserService.getAll();
 *     res.json(users);
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
