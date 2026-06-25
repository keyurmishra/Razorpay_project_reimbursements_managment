'use strict';

const jwt = require('jsonwebtoken');

const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

// ── Constant ──────────────────────────────────────────────────────────────────
const AUTH_COOKIE = 'authToken';

/**
 * authenticate
 *
 * Protects private routes by verifying the JWT stored in the HTTP-only cookie.
 *
 * Steps:
 *   1. Extract the token from req.cookies.authToken
 *   2. Verify the token signature and expiry using JWT_SECRET
 *   3. Fetch the user from the database to confirm they still exist
 *   4. Attach the user to req.user and call next()
 *
 * Error cases:
 *   - No cookie / no token   → 401 "Authentication required."
 *   - Token expired           → 401 "Your session has expired. Please log in again."
 *   - Token signature invalid → 401 "Invalid token. Please log in again."
 *   - User no longer in DB    → 401 "The account belonging to this token no longer exists."
 *
 * @type {import('express').RequestHandler}
 */
const authenticate = async (req, res, next) => {
  try {
    // ── Step 1: Extract token ──────────────────────────────────────────────────
    const token = req.cookies?.[AUTH_COOKIE];

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // ── Step 2: Verify token ───────────────────────────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(
          new AppError('Your session has expired. Please log in again.', 401)
        );
      }
      // JsonWebTokenError, NotBeforeError, or any other JWT failure
      return next(
        new AppError('Invalid token. Please log in again.', 401)
      );
    }

    // ── Step 3: Confirm user still exists in DB ────────────────────────────────
    // This prevents tokens issued to deleted / deactivated accounts from working.
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return next(
        new AppError('The account belonging to this token no longer exists.', 401)
      );
    }

    // ── Step 4: Attach user to request ────────────────────────────────────────
    // req.user is available in every downstream middleware and controller.
    // passwordHash is excluded by the model's defaultScope.
    req.user = user;

    next();
  } catch (err) {
    // Catch unexpected errors (e.g. DB down) and forward to errorHandler
    next(err);
  }
};

module.exports = authenticate;
