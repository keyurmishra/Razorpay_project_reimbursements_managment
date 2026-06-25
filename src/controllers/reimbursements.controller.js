'use strict';

const reimbursementsService                           = require('../services/reimbursements.service');
const { validateCreateReimbursement, validateDecision } = require('../validations/reimbursements.validation');
const asyncHandler                                    = require('../utils/asyncHandler');

/**
 * createReimbursement
 *
 * @route   POST /rest/reimbursements
 * @access  Private — EMP only  (enforced by authenticate + authorize in the router)
 *
 * @desc    Submits a new reimbursement request.
 *          The employee identity is derived from req.user, not from the body.
 *          Status is always set to PENDING by the service layer.
 */
const createReimbursement = asyncHandler(async (req, res) => {
  // 1. Validate body shape — throws AppError(400) on failure
  validateCreateReimbursement(req.body);

  const { title, description, amount } = req.body;

  // 2. Delegate to service
  const reimbursement = await reimbursementsService.createReimbursement(
    { title, description, amount },
    req.user    // actingUser — employeeId sourced from authenticated session
  );

  // 3. Respond
  return res.status(201).json({
    success: true,
    message: 'Reimbursement request submitted successfully.',
    data: { reimbursement },
  });
});

/**
 * processDecision
 *
 * @route   POST /rest/reimbursements/:id/decision
 * @access  Private — RM, APE, CFO  (enforced by authenticate + authorize in the router)
 *
 * @desc    Records an approval or rejection decision for a reimbursement.
 *          The acting role determines which status transitions are permitted.
 *          Every decision is stored as an immutable row in the approvals table.
 */
const processDecision = asyncHandler(async (req, res) => {
  // 1. Validate body — throws AppError(400) on failure
  validateDecision(req.body);

  const reimbursementId = Number(req.params.id);
  const decision        = req.body.decision.trim().toUpperCase();

  // 2. Delegate to service (state-machine + duplicate guard inside)
  const { reimbursement, approval } = await reimbursementsService.processDecision(
    reimbursementId,
    decision,
    req.user
  );

  // 3. Respond
  return res.status(200).json({
    success: true,
    message: `Decision '${decision}' recorded. Reimbursement status is now '${reimbursement.status}'.`,
    data: { reimbursement, approval },
  });
});

/**
 * listReimbursements
 *
 * @route   GET /rest/reimbursements
 * @access  Private — all roles (EMP, RM, APE, CFO)
 *
 * @desc    Returns reimbursements visible to the authenticated user.
 *          Visibility is role-scoped entirely in the service layer:
 *          EMP  → own submissions (any status)
 *          RM   → PENDING from direct subordinates
 *          APE  → all RM_APPROVED requests
 *          CFO  → all APPROVED requests
 */
const listReimbursements = asyncHandler(async (req, res) => {
  const reimbursements = await reimbursementsService.listReimbursements(req.user);

  return res.status(200).json({
    success: true,
    count: reimbursements.length,
    data: { reimbursements },
  });
});

module.exports = { createReimbursement, processDecision, listReimbursements };
