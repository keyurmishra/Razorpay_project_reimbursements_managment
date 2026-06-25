'use strict';

const Joi = require('joi');

// ── Reusable positive-integer field ──────────────────────────────────────────
const positiveInt = (label) =>
  Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base':    `${label} must be a positive integer.`,
      'number.integer': `${label} must be a positive integer.`,
      'number.min':     `${label} must be a positive integer.`,
      'any.required':   `${label} is required.`,
    });

// ── Schemas ───────────────────────────────────────────────────────────────────

/**
 * POST /rest/employees/assign
 *
 * Body:
 *   employeeId : positive integer  (required)
 *   managerId  : positive integer  (required)
 */
const assignEmployeeSchema = Joi.object({
  employeeId: positiveInt('employeeId'),
  managerId:  positiveInt('managerId'),
});

/**
 * DELETE /rest/employees/assign
 *
 * Body:
 *   employeeId : positive integer  (required)
 */
const removeEmployeeSchema = Joi.object({
  employeeId: positiveInt('employeeId'),
});

module.exports = { assignEmployeeSchema, removeEmployeeSchema };
