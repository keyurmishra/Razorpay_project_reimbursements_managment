'use strict';

const Joi = require('joi');

// ── Schemas ───────────────────────────────────────────────────────────────────

/**
 * POST /rest/reimbursements
 *
 * Body:
 *   title       : string, 2–200 chars  (required)
 *   description : string               (optional)
 *   amount      : positive number, ≤ 2 decimal places  (required)
 *
 * Note: `status` is intentionally absent — it is always forced to PENDING
 * by the service layer. stripUnknown:true in the validate middleware removes
 * any status field a client might try to inject.
 */
const createReimbursementSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'title is required.',
      'any.required': 'title is required.',
      'string.min':   'title must be between 2 and 200 characters.',
      'string.max':   'title must be between 2 and 200 characters.',
    }),

  description: Joi.string()
    .trim()
    .optional()
    .allow('', null)
    .messages({
      'string.base': 'description must be a string.',
    }),

  amount: Joi.number()
    .positive()
    .precision(2)     // at most 2 decimal places
    .required()
    .messages({
      'number.base':      'amount must be a valid number.',
      'number.positive':  'amount must be greater than zero.',
      'number.precision': 'amount must have at most two decimal places.',
      'any.required':     'amount is required.',
    }),
});

/**
 * POST /rest/reimbursements/:id/decision
 *
 * Body:
 *   decision : 'APPROVED' | 'REJECTED'  (required)
 */
const decisionSchema = Joi.object({
  decision: Joi.string()
    .trim()
    .uppercase()
    .valid('APPROVED', 'REJECTED')
    .required()
    .messages({
      'string.empty': 'decision is required.',
      'any.required': 'decision is required.',
      'any.only':     'decision must be one of: APPROVED, REJECTED.',
    }),
});

module.exports = { createReimbursementSchema, decisionSchema };
