'use strict';

const express    = require('express');
const router     = express.Router();

const authenticate        = require('../middleware/authenticate');
const authorize           = require('../middleware/authorize');
const employeesController = require('../controllers/employees.controller');

/**
 * Employees Routes
 * Base path: /rest/employees  (mounted in src/routes/index.js)
 *
 * GET    /rest/employees        → RM | APE | CFO — role-scoped user list
 * POST   /rest/employees/assign → CFO only — assign an employee to an RM
 * DELETE /rest/employees/assign → CFO only — remove an employee's manager assignment
 */

// ── RM / APE / CFO: role-scoped user list ────────────────────────────────────
// EMP is explicitly excluded — they have no visibility over the user directory.
router.get(
  '/',
  authenticate,
  authorize('RM', 'APE', 'CFO'),
  employeesController.listEmployees
);

// ── CFO: assign an employee to a reporting manager ───────────────────────────
router.post(
  '/assign',
  authenticate,
  authorize('CFO'),
  employeesController.assignEmployee
);

// ── CFO: remove an employee's manager assignment ─────────────────────────────
router.delete(
  '/assign',
  authenticate,
  authorize('CFO'),
  employeesController.removeEmployee
);

module.exports = router;
