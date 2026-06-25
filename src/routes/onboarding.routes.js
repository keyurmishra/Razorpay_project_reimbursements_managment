'use strict';

const express = require('express');
const router = express.Router();

const authController               = require('../controllers/auth.controller');
const validate                     = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

/**
 * Onboarding Routes
 * Base path: /rest/onboardings  (mounted in src/routes/index.js)
 *
 * POST /rest/onboardings/register  → create a new account
 * POST /rest/onboardings/login     → authenticate and receive a cookie
 * POST /rest/onboardings/logout    → clear the auth cookie
 */

router.post('/register', validate(registerSchema), authController.register);
router.post('/login',    validate(loginSchema),    authController.login);
router.post('/logout',                             authController.logout);

module.exports = router;


/**
 * Onboarding Routes
 * Base path: /rest/onboardings  (mounted in src/routes/index.js)
 *
 * POST /rest/onboardings/register  → create a new account
 * POST /rest/onboardings/login     → authenticate and receive a cookie
 * POST /rest/onboardings/logout    → clear the auth cookie
 */

router.post('/register', authController.register);
router.post('/login',    authController.login);
router.post('/logout',   authController.logout);

module.exports = router;
