'use strict';

const express    = require('express');
const router     = express.Router();

const authenticate               = require('../middleware/authenticate');
const authorize                  = require('../middleware/authorize');
const reimbursementsController   = require('../controllers/reimbursements.controller');

/**
 * Reimbursements Routes
 * Base path: /rest/reimbursements  (mounted in src/routes/index.js)
 *
 * GET  /rest/reimbursements         → all roles — role-scoped list
 * POST /rest/reimbursements         → EMP only — submit a new request
 * POST /rest/reimbursements/:id/decision → RM | APE | CFO — record a decision
 */

// ── All roles: list reimbursements (role-scoped visibility in service) ────────
router.get(
  '/',
  authenticate,
  authorize('EMP', 'RM', 'APE', 'CFO'),
  reimbursementsController.listReimbursements
);

// ── EMP: submit a new request ─────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('EMP'),
  reimbursementsController.createReimbursement
);

// ── RM / APE / CFO: record a decision ────────────────────────────────────────
// authorize() accepts multiple roles — any one of RM, APE, CFO can reach this.
// The service layer then enforces which role can act on which status.
router.post(
  '/:id/decision',
  authenticate,
  authorize('RM', 'APE', 'CFO'),
  reimbursementsController.processDecision
);

module.exports = router;
