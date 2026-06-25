'use strict';

const Joi = require('joi');

// ── Shared constants ──────────────────────────────────────────────────────────
const ALLOWED_DOMAIN  = 'org.com';
const PASSWORD_MIN    = 8;
const USER_ROLES      = ['EMP', 'RM', 'APE', 'CFO'];

// ── Reusable field definitions ────────────────────────────────────────────────

/**
 * Shared email rule:
 *   - valid email format
 *   - must belong to @org.com
 *   - normalised to lowercase (Joi convert)
 */
const emailField = Joi.string()
  .trim()
  .email({ tlds: { allow: false } })   // tlds:false → no live TLD check, just format
  .custom((value, helpers) => {
    if (!value.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
      return helpers.error('any.invalid');
    }
    return value.toLowerCase();
  })
  .messages({
    'string.empty':   'email is required.',
    'any.required':   'email is required.',
    'string.email':   'email must be a valid email address.',
    'any.invalid':    `email must belong to the @${ALLOWED_DOMAIN} domain.`,
  });

/**
 * Shared password rule:
 *   - min 8 characters
 *   - at least one letter
 *   - at least one number
 */
const passwordField = Joi.string()
  .min(PASSWORD_MIN)
  .pattern(/[a-zA-Z]/, 'letter')
  .pattern(/[0-9]/,    'digit')
  .messages({
    'string.empty':     'password is required.',
    'any.required':     'password is required.',
    'string.min':       `password must be at least ${PASSWORD_MIN} characters long.`,
    'string.pattern.name': 'password must contain at least one {#name}.',
  });

// ── Schemas ───────────────────────────────────────────────────────────────────

/**
 * POST /rest/onboardings/register
 */
const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'name is required.',
      'any.required': 'name is required.',
      'string.min':   'name must be between 2 and 100 characters.',
      'string.max':   'name must be between 2 and 100 characters.',
    }),

  email: emailField.required(),

  password: passwordField.required(),

  role: Joi.string()
    .trim()
    .uppercase()
    .valid(...USER_ROLES)
    .optional()
    .messages({
      'any.only': `role must be one of: ${USER_ROLES.join(', ')}.`,
    }),
});

/**
 * POST /rest/onboardings/login
 */
const loginSchema = Joi.object({
  email:    emailField.required(),
  password: Joi.string().required().messages({
    'string.empty': 'password is required.',
    'any.required': 'password is required.',
  }),
});

module.exports = { registerSchema, loginSchema };
