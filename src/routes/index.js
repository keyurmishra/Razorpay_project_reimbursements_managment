'use strict';

const express = require('express');
const router = express.Router();

const onboardingRoutes       = require('./onboarding.routes');
const rolesRoutes            = require('./roles.routes');
const employeesRoutes        = require('./employees.routes');
const reimbursementsRoutes   = require('./reimbursements.routes');

/**
 * API Health Check
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is up and running 🚀',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Feature Routers ───────────────────────────────────────────────────────────
// POST /rest/onboardings/register
// POST /rest/onboardings/login
// POST /rest/onboardings/logout
router.use('/rest/onboardings', onboardingRoutes);

// POST /rest/roles/assign
router.use('/rest/roles', rolesRoutes);

// POST   /rest/employees/assign
// DELETE /rest/employees/assign
router.use('/rest/employees', employeesRoutes);

// POST /rest/reimbursements
router.use('/rest/reimbursements', reimbursementsRoutes);

module.exports = router;


