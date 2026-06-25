'use strict';

const Joi = require('joi');

const USER_ROLES = ['EMP', 'RM', 'APE', 'CFO'];

/**
 * POST /rest/roles/assign
 *
 * Body:
 *   userId  : positive integer  (required)
 *   role    : one of EMP | RM | APE | CFO  (required)
 */
const assignRoleSchema = Joi.object({
  userId: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base':    'userId must be a positive integer.',
      'number.integer': 'userId must be a positive integer.',
      'number.min':     'userId must be a positive integer.',
      'any.required':   'userId is required.',
    }),

  role: Joi.string()
    .trim()
    .uppercase()
    .valid(...USER_ROLES)
    .required()
    .messages({
      'string.empty': 'role is required.',
      'any.required': 'role is required.',
      'any.only':     `role must be one of: ${USER_ROLES.join(', ')}.`,
    }),
});

module.exports = { assignRoleSchema, ALLOWED_ROLES: USER_ROLES };
