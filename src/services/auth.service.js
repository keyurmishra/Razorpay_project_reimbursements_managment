'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

// ── Constants ─────────────────────────────────────────────────────────────────
const BCRYPT_SALT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sign a JWT for the given user payload.
 *
 * @param {{ id: number, email: string, role: string }} payload
 * @returns {string} signed JWT
 */
const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Build the cookie options object.
 * - httpOnly: true   → JS cannot read the cookie (XSS protection)
 * - secure  : true   → only sent over HTTPS in production
 * - sameSite: 'lax'  → CSRF protection for cross-site requests
 *
 * @returns {import('express').CookieOptions}
 */
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
});

// ── Service Methods ───────────────────────────────────────────────────────────

/**
 * register
 * 1. Check the email is not already taken.
 * 2. Hash the plain-text password.
 * 3. Persist the user record.
 * 4. Sign and return a JWT + safe user object.
 *
 * @param {{ name: string, email: string, password: string, role?: string }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
const register = async ({ name, email, password, role }) => {
  // 1. Duplicate email check
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // 3. Create user
  const user = await userRepository.createUser({ name, email, passwordHash, role });

  // 4. Sign token — include only non-sensitive fields
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  // Return a safe user object (passwordHash is already excluded via defaultScope)
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  return { token, user: safeUser };
};

/**
 * login
 * 1. Fetch the user by email (including passwordHash for comparison).
 * 2. Compare the plain-text password against the stored hash.
 * 3. Sign and return a JWT + safe user object.
 *
 * NOTE: The error message is intentionally generic ("Invalid credentials")
 * to avoid leaking whether an email is registered or not (user enumeration).
 *
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
const login = async ({ email, password }) => {
  // 1. Fetch user with password hash (uses withPassword scope)
  const user = await userRepository.findByEmailWithPassword(email);
  if (!user) {
    throw new AppError('Invalid credentials.', 401);
  }

  // 2. Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid credentials.', 401);
  }

  // 3. Sign token
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return { token, user: safeUser };
};

module.exports = { register, login, cookieOptions };
