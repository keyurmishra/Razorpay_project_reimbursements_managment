'use strict';

const AppError = require('../utils/AppError');

/**
 * validate
 *
 * Express middleware factory that validates req.body against a Joi schema.
 * On failure, it formats Joi's error messages into our standard AppError shape
 * and calls next(err), letting the global error handler produce the response.
 *
 * This keeps controllers completely free of validation code — a route is wired as:
 *   router.post('/path', authenticate, validate(schema), controller)
 *
 * Joi options used:
 *   abortEarly : false  → collect ALL errors, not just the first one
 *   stripUnknown: true  → silently remove fields not declared in the schema
 *                          (defence against mass-assignment / extra noise)
 *   convert    : true   → allow Joi to coerce types (string "123" → number 123)
 *
 * @param {import('joi').ObjectSchema} schema - A Joi object schema
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   const { registerSchema } = require('../validations/auth.validation');
 *   router.post('/register', validate(registerSchema), authController.register);
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:    false,   // return all errors, not just the first
    stripUnknown:  true,    // remove undeclared keys from the body
    convert:       true,    // coerce compatible types (e.g. "5" → 5 for number fields)
  });

  if (error) {
    // Map Joi's ValidationError details to a flat string array that matches
    // the format our global errorHandler and consumers already expect.
    const messages = error.details.map((d) => d.message.replace(/['"]/g, ''));

    const err = new AppError('Validation failed.', 400);
    err.errors = messages;
    return next(err);
  }

  // Replace req.body with the Joi-sanitised value so downstream middleware
  // and controllers receive clean, coerced, extra-field-stripped data.
  req.body = value;
  next();
};

module.exports = validate;
