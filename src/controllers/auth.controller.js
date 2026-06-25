'use strict';

const authService = require('../services/auth.service');
const { validateRegister, validateLogin } = require('../validations/auth.validation');
const asyncHandler = require('../utils/asyncHandler');

// ── Cookie name constant ──────────────────────────────────────────────────────
const AUTH_COOKIE = 'authToken';

/**
 * @route   POST /rest/onboardings/register
 * @access  Public
 *
 * @desc    Register a new user.
 *          Validates the request body, calls the auth service,
 *          sets an HTTP-only cookie, and returns the new user.
 */
const register = asyncHandler(async (req, res) => {
  // 1. Validate — throws AppError(400) on failure, caught by asyncHandler → errorHandler
  validateRegister(req.body);

  const { name, email, password, role } = req.body;

  // 2. Delegate business logic to the service layer
  const { token, user } = await authService.register({ name, email, password, role });

  // 3. Set JWT in HTTP-only cookie
  res.cookie(AUTH_COOKIE, token, authService.cookieOptions());

  // 4. Respond
  return res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { user },
  });
});

/**
 * @route   POST /rest/onboardings/login
 * @access  Public
 *
 * @desc    Authenticate an existing user.
 *          Validates credentials, sets an HTTP-only cookie, and returns the user.
 */
const login = asyncHandler(async (req, res) => {
  // 1. Validate
  validateLogin(req.body);

  const { email, password } = req.body;

  // 2. Service handles credential verification
  const { token, user } = await authService.login({ email, password });

  // 3. Set JWT in HTTP-only cookie
  res.cookie(AUTH_COOKIE, token, authService.cookieOptions());

  // 4. Respond
  return res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: { user },
  });
});

/**
 * @route   POST /rest/onboardings/logout
 * @access  Public (no auth required — clearing cookie is always safe)
 *
 * @desc    Clear the auth cookie to log the user out.
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

module.exports = { register, login, logout };
